from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import os
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "false"

from google import genai
import nltk
import torch
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sentence_transformers import SentenceTransformer, util
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from pymongo import MongoClient
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from dotenv import load_dotenv
from datetime import datetime


# ------------------------
# Flask Setup
# ------------------------
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ------------------------
# MongoDB Setup ✅ (Single Database)
# ------------------------
client = MongoClient("mongodb://localhost:27017/")
db = client["gradex_db"]
reports_collection = db["reports"]


# ------------------------
# Globals
# ------------------------
processing_mode = None
teacher_answers = []
exam_name = None

# ✅ Store page images
teacher_page_images = {}
student_page_images = {}


# ------------------------
# NLTK Setup
# ------------------------
nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("punkt_tab", quiet=True)

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words("english"))
negation_words = {"not", "never", "no", "none", "cannot", "n't"}


# ------------------------
# Load ENV + Models
# ------------------------
load_dotenv()

sbert_model = SentenceTransformer("all-MiniLM-L6-v2")

gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

cross_encoder_model = AutoModelForSequenceClassification.from_pretrained(
    "cross-encoder/stsb-roberta-large"
)
cross_encoder_tokenizer = AutoTokenizer.from_pretrained(
    "cross-encoder/stsb-roberta-large"
)


# ------------------------
# Image Preprocessing
# ------------------------
def clean_for_handwriting(pil_img):
    img = np.array(pil_img)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    thresh = cv2.adaptiveThreshold(
        blur,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        15,
        4,
    )

    return Image.fromarray(thresh)


# ------------------------
# NLP Similarity
# ------------------------
def preprocess_text(text):
    tokens = word_tokenize(text.lower())
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(tokens)


def contains_negation(text):
    tokens = set(word_tokenize(text.lower()))
    return any(word in negation_words for word in tokens)


def bert_similarity(student_answer, original_answer):
    student_answer_clean = preprocess_text(student_answer)
    original_answer_clean = preprocess_text(original_answer)

    emb1 = sbert_model.encode(student_answer_clean, convert_to_tensor=True)
    emb2 = sbert_model.encode(original_answer_clean, convert_to_tensor=True)

    similarity = util.pytorch_cos_sim(emb1, emb2).item() * 100

    inputs = cross_encoder_tokenizer(
        student_answer_clean,
        original_answer_clean,
        return_tensors="pt",
        truncation=True,
    )

    with torch.no_grad():
        logits = cross_encoder_model(**inputs).logits

    contextual_score = torch.sigmoid(logits).item() * 100

    # ✅ negation penalty
    student_has_negation = contains_negation(student_answer)
    original_has_negation = contains_negation(original_answer)

    if student_has_negation != original_has_negation:
        similarity *= 0.5
        contextual_score *= 0.5

    return similarity, contextual_score


# ------------------------
# OCR Using Gemini
# ------------------------
def extract_text_from_image(image):
    try:
        response = gemini_client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=[
                "You are an OCR engine. Read this handwritten answer sheet. "
                "Extract ALL visible handwritten text exactly as written. "
                "Do NOT summarize. Do NOT explain. Output only the raw text.",
                image,
            ],
        )

        text = response.text.strip()

        if len(text) < 5:
            return "NO_TEXT_DETECTED"

        return text

    except Exception as e:
        print("Gemini OCR failed:", e)
        return "OCR_ERROR"


# ------------------------
# Extract PDF text + store page images ✅
# ------------------------
def extract_text_from_pdf(pdf_path):
    global processing_mode, teacher_page_images, student_page_images

    doc = fitz.open(pdf_path)
    extracted_text_list = []

    for i, page in enumerate(doc):
        try:
            pix = page.get_pixmap(matrix=fitz.Matrix(4, 4))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            if processing_mode == "teacher":
                teacher_page_images[i] = img
                text = pytesseract.image_to_string(img).strip()
            else:
                student_page_images[i] = img
                clean_img = clean_for_handwriting(img)
                text = extract_text_from_image(clean_img)

            extracted_text_list.append(text if text else "NO_TEXT_DETECTED")

        except Exception as e:
            print(f"Page {i+1} failed: {e}")
            extracted_text_list.append("EXTRACTION_ERROR")

    doc.close()
    return extracted_text_list


# ------------------------
# ✅ Image Similarity + Image Marks
# ------------------------
def image_similarity(img1, img2):
    img1 = cv2.cvtColor(np.array(img1), cv2.COLOR_RGB2GRAY)
    img2 = cv2.cvtColor(np.array(img2), cv2.COLOR_RGB2GRAY)

    img1 = cv2.resize(img1, (500, 500))
    img2 = cv2.resize(img2, (500, 500))

    score, _ = ssim(img1, img2, full=True)
    return score


def image_marks(score):
    if score > 0.85:
        return 10
    elif score > 0.70:
        return 8
    elif score > 0.55:
        return 6
    elif score > 0.40:
        return 4
    else:
        return 0


# ==========================================================
# ✅ ROUTES
# ==========================================================

# ------------------------
# Teacher Upload ✅
# ------------------------
@app.route("/upload/teacher", methods=["POST"])
def upload_teacher_pdf():
    global processing_mode, exam_name, teacher_answers
    global teacher_page_images, student_page_images

    # ✅ Reset old data
    teacher_page_images.clear()
    student_page_images.clear()
    teacher_answers = []

    if "pdf" not in request.files or "examName" not in request.form:
        return jsonify({"error": "Missing file or exam name"}), 400

    exam_name = request.form["examName"]
    pdf_file = request.files["pdf"]

    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_file.filename)
    pdf_file.save(pdf_path)

    processing_mode = "teacher"
    teacher_answers = extract_text_from_pdf(pdf_path)

    return jsonify(
        {
            "message": "Teacher answers uploaded successfully ✅",
            "examName": exam_name,
            "pages": len(teacher_answers),
        }
    )


# ------------------------
# Student Upload (API for React) ✅ TEXT + IMAGE scoring
# ------------------------
@app.route("/upload/student_api", methods=["POST"])
def upload_student_pdf_api():
    global processing_mode, teacher_answers
    global student_page_images

    processing_mode = "student"

    student_name = request.form.get("studentName")
    roll_number = request.form.get("rollNumber")

    if not teacher_answers or len(teacher_answers) == 0:
        return jsonify({"error": "Teacher key not uploaded yet"}), 400

    if "pdf" not in request.files:
        return jsonify({"error": "No file"}), 400

    # ✅ reset student images each time
    student_page_images.clear()

    pdf_file = request.files["pdf"]
    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_file.filename)
    pdf_file.save(pdf_path)

    extracted_answers = extract_text_from_pdf(pdf_path)

    comparisons = {}

    # ✅ compare page-wise
    for page, (student_text, teacher_text) in enumerate(
        zip(extracted_answers, teacher_answers), start=1
    ):
        # ---------------- TEXT evaluation ----------------
        similarity_score, contextual_score = bert_similarity(student_text, teacher_text)

        text_score = 10 * (
            0.4 * (similarity_score / 100) + 0.6 * (contextual_score / 100)
        )

        # ---------------- IMAGE evaluation ----------------
        teacher_img = teacher_page_images.get(page - 1)
        student_img = student_page_images.get(page - 1)

        if teacher_img is not None and student_img is not None:
            img_sim = image_similarity(student_img, teacher_img)
            img_score = image_marks(img_sim)
        else:
            img_sim = 0
            img_score = 0

        # ---------------- FINAL score ----------------
        final_score = round((0.7 * text_score) + (0.3 * img_score), 0)

        comparisons[page] = {
            "student_text": student_text,
            "teacher_text": teacher_text,

            # ✅ show both marks clearly
            "similarity_score": round(similarity_score, 1),
            "contextual_score": round(contextual_score, 1),

            "text_marks": round(text_score, 1),
            "image_similarity": round(img_sim, 3),
            "image_marks": img_score,

            # ✅ Final
            "total_score": final_score,
        }

    return jsonify(
        {
            "student_name": student_name,
            "roll_number": roll_number,
            "comparisons": comparisons,
        }
    )


# ------------------------
# (Optional) Student Upload HTML page (kept)
# ------------------------
@app.route("/upload/student", methods=["POST"])
def upload_student_pdf():
    global processing_mode
    processing_mode = "student"

    if "pdf" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    pdf_file = request.files["pdf"]
    pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], pdf_file.filename)
    pdf_file.save(pdf_path)

    extracted_answers = extract_text_from_pdf(pdf_path)

    comparisons = {}
    for page, (student_text, teacher_text) in enumerate(
        zip(extracted_answers, teacher_answers), start=1
    ):
        similarity_score, contextual_score = bert_similarity(student_text, teacher_text)

        text_score = 10 * (
            0.4 * (similarity_score / 100) + 0.6 * (contextual_score / 100)
        )

        teacher_img = teacher_page_images.get(page - 1)
        student_img = student_page_images.get(page - 1)

        if teacher_img is not None and student_img is not None:
            img_sim = image_similarity(student_img, teacher_img)
            img_score = image_marks(img_sim)
        else:
            img_score = 0

        final_score = round((0.7 * text_score) + (0.3 * img_score), 0)

        comparisons[page] = {
            "student_text": student_text,
            "teacher_text": teacher_text,
            "text_marks": round(text_score, 1),
            "image_marks": img_score,
            "final_score": final_score,
        }

    return render_template("result.html", comparisons=comparisons)


# ------------------------
# ✅ Save Report (Single DB + exam_name + created_at + no duplicates)
# ------------------------
@app.route("/save-report", methods=["POST"])
def save_report():
    try:
        global exam_name
        data = request.json

        data["exam_name"] = exam_name if exam_name else "Unknown Exam"
        data["created_at"] = datetime.utcnow().isoformat()

        # ✅ Prevent duplicates: same exam + roll number will update
        reports_collection.update_one(
            {"exam_name": data["exam_name"], "roll_number": data["roll_number"]},
            {"$set": data},
            upsert=True,
        )

        return jsonify({"message": "Report saved successfully ✅"}), 200

    except Exception as e:
        print(f"Error saving report: {e}")
        return jsonify({"error": "Failed to save the report"}), 500


# ------------------------
# ✅ Fetch Reports (Sorted latest first)
# ------------------------
@app.route("/reports", methods=["GET"])
def get_reports():
    try:
        reports = list(reports_collection.find({}, {"_id": 0}).sort("created_at", -1))
        return jsonify(reports), 200
    except Exception as e:
        print(f"Error fetching reports: {e}")
        return jsonify({"error": "Failed to fetch reports"}), 500


# ------------------------
# Reset teacher answers
# ------------------------
@app.route("/reset/teacher", methods=["GET"])
def reset_teacher():
    global teacher_answers, exam_name
    global teacher_page_images, student_page_images

    teacher_answers = []
    exam_name = None
    teacher_page_images.clear()
    student_page_images.clear()

    return jsonify({"message": "Teacher answers reset successfully ✅"})


# ------------------------
# Run
# ------------------------
if __name__ == "__main__":
    app.run(debug=True)
