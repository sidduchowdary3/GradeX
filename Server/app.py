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
import torch.nn.functional as F
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sentence_transformers import SentenceTransformer, util
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    ViTModel,
    ViTFeatureExtractor,
)
from pymongo import MongoClient
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from dotenv import load_dotenv
from datetime import datetime

# ---- CLIP ----
try:
    import clip as clip_lib
    _CLIP_AVAILABLE = True
except ImportError:
    _CLIP_AVAILABLE = False
    print("⚠️  clip package not installed. CLIP similarity will be skipped.")

# ---- torchvision transforms (used for DINO pre-processing) ----
try:
    from torchvision import transforms as T
    _TORCHVISION_AVAILABLE = True
except ImportError:
    _TORCHVISION_AVAILABLE = False
    print("⚠️  torchvision not installed. DINO similarity will be skipped.")


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
# Load CLIP Model ✅
# ------------------------
if _CLIP_AVAILABLE:
    try:
        _clip_device = "cuda" if torch.cuda.is_available() else "cpu"
        _clip_model, _clip_preprocess = clip_lib.load("ViT-B/32", device=_clip_device)
        _clip_model.eval()
        print("✅ CLIP model loaded.")
    except Exception as _e:
        _CLIP_AVAILABLE = False
        print(f"⚠️  CLIP model load failed: {_e}")

# ------------------------
# Load DINO Model (facebook/dino-vitb16) ✅
# ------------------------
_DINO_AVAILABLE = False
if _TORCHVISION_AVAILABLE:
    try:
        _dino_device = "cuda" if torch.cuda.is_available() else "cpu"
        _dino_extractor = ViTFeatureExtractor.from_pretrained("facebook/dino-vitb16")
        _dino_model = ViTModel.from_pretrained("facebook/dino-vitb16")
        _dino_model.eval()
        _dino_model.to(_dino_device)
        _DINO_AVAILABLE = True
        print("✅ DINO model loaded.")
    except Exception as _e:
        print(f"⚠️  DINO model load failed: {_e}")


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
# ✅ Split text into questions by number patterns (1) / 1. / Q1 etc.
# ------------------------
import re

def split_text_by_questions(text):
    """
    Splits a block of text into individual question answers.
    Detects patterns like: 1) 2) 3)  or  1. 2. 3.  or  Q1 Q2 Q3
    Strips the question/prompt line — returns ONLY the student's answer text.
    Returns a list of (question_number, answer_text) tuples.
    """
    pattern = r'(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.)]\s*'
    splits = list(re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE))

    if len(splits) < 1:
        return [(1, text.strip())]

    questions = []

    for idx, match in enumerate(splits):
        q_num = int(match.group(1))
        start = match.end()
        end = splits[idx + 1].start() if idx + 1 < len(splits) else len(text)

        full_text = text[start:end].strip()

        # ✅ Strip the question/prompt line — keep only the answer lines
        lines = full_text.split("\n")
        # First line is usually the question text itself; skip it if more lines exist
        if len(lines) > 1:
            answer_text = "\n".join(lines[1:]).strip()
        else:
            answer_text = full_text  # single-line fallback (already just the answer)

        questions.append((q_num, answer_text))

    return questions



# ------------------------
# ✅ Split a page image into question regions by horizontal position
# Uses the same question split boundaries found in teacher text
# to crop the image proportionally
# ------------------------
def split_image_by_question_count(pil_img, num_questions):
    """
    Divides the page image into `num_questions` equal horizontal strips.
    Returns a list of PIL images, one per question region.
    """
    if num_questions <= 1:
        return [pil_img]

    width, height = pil_img.size
    strip_height = height // num_questions
    strips = []
    for i in range(num_questions):
        top = i * strip_height
        bottom = (i + 1) * strip_height if i < num_questions - 1 else height
        strip = pil_img.crop((0, top, width, bottom))
        strips.append(strip)
    return strips


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
# ✅ DIAGRAM DETECTION + ADVANCED DIAGRAM EVALUATION
# ==========================================================

# ------------------------
# Diagram Detection ✅
# Decides whether a page contains a meaningful diagram by
# measuring edge density and large non-text contour presence.
# ------------------------
def detect_diagram(pil_img, edge_density_threshold=0.04, min_contour_area=3000):
    """
    Returns True when the page is judged to contain a diagram.

    Strategy:
    - Convert to grayscale and apply Canny edge detection.
    - Compute edge pixel density (edges / total pixels).
    - Find contours; count those larger than min_contour_area
      (text characters are small; diagram shapes are large).
    - Page is a diagram if edge_density >= threshold AND at least
      one large contour exists.
    """
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)
    img = cv2.resize(img, (800, 800))

    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    edge_density = np.sum(edges > 0) / edges.size

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    large_contours = [c for c in contours if cv2.contourArea(c) > min_contour_area]

    return edge_density >= edge_density_threshold and len(large_contours) > 0


# ------------------------
# CLIP-based Semantic Image Similarity ✅
# Encodes both images with CLIP ViT-B/32 and returns cosine similarity.
# Captures high-level semantic meaning (e.g., "flowchart" vs "circuit").
# ------------------------
def clip_similarity(pil_img1, pil_img2):
    if not _CLIP_AVAILABLE:
        return 0.0
    try:
        t1 = _clip_preprocess(pil_img1).unsqueeze(0).to(_clip_device)
        t2 = _clip_preprocess(pil_img2).unsqueeze(0).to(_clip_device)

        with torch.no_grad():
            f1 = _clip_model.encode_image(t1)
            f2 = _clip_model.encode_image(t2)

        score = F.cosine_similarity(f1, f2).item()
        # cosine is in [-1, 1]; map to [0, 1]
        return (score + 1) / 2
    except Exception as e:
        print(f"CLIP similarity error: {e}")
        return 0.0


# ------------------------
# DINO-based Visual Feature Similarity ✅
# Uses facebook/dino-vitb16 CLS token embeddings.
# More robust to drawing style variations than pixel-level methods.
# ------------------------
def dino_similarity(pil_img1, pil_img2):
    if not _DINO_AVAILABLE:
        return 0.0
    try:
        def get_embedding(img):
            inputs = _dino_extractor(images=img.convert("RGB"), return_tensors="pt")
            inputs = {k: v.to(_dino_device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = _dino_model(**inputs)
            # CLS token = outputs.last_hidden_state[:, 0, :]
            return outputs.last_hidden_state[:, 0, :]

        e1 = get_embedding(pil_img1)
        e2 = get_embedding(pil_img2)

        score = F.cosine_similarity(e1, e2).item()
        return (score + 1) / 2
    except Exception as e:
        print(f"DINO similarity error: {e}")
        return 0.0


# ------------------------
# ORB-based Structural Keypoint Matching ✅
# Detects and matches keypoints using the ORB descriptor.
# Evaluates structural/spatial layout similarity of diagrams.
# Returns ratio of good matches to total keypoints detected.
# ------------------------
def orb_similarity(pil_img1, pil_img2, max_features=1000, good_match_ratio=0.75):
    try:
        def to_gray(img):
            arr = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2GRAY)
            return cv2.resize(arr, (600, 600))
        g1, g2 = to_gray(pil_img1), to_gray(pil_img2)
        orb = cv2.ORB_create(nfeatures=max_features)
        kp1, des1 = orb.detectAndCompute(g1, None)
        kp2, des2 = orb.detectAndCompute(g2, None)
        if des1 is None or des2 is None or len(kp1) == 0 or len(kp2) == 0:
            return 0.0
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        raw_matches = bf.knnMatch(des1, des2, k=2)
        good = [m for m, n in raw_matches if m.distance < good_match_ratio * n.distance]
        total = min(len(kp1), len(kp2))
        score = len(good) / total if total > 0 else 0.0
        return min(score, 1.0)
    except Exception as e:
        print(f"ORB similarity error: {e}")
        return 0.0


# ------------------------
# OCR Label Extraction + Text Similarity ✅
# Extracts printed/handwritten labels from diagram regions using
# Tesseract, then compares label sets using SBERT cosine similarity.
# Handles cases where diagrams have different but semantically
# equivalent annotations.
# ------------------------
def ocr_label_similarity(pil_img1, pil_img2):
    try:
        def extract_labels(img):
            gray = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2GRAY)
            # Threshold to isolate text within the diagram
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            text = pytesseract.image_to_string(
                Image.fromarray(thresh),
                config="--psm 11 --oem 3",   # sparse text mode — good for labels
            ).strip()
            return text if text else "NO_LABELS"
        labels1 = extract_labels(pil_img1)
        labels2 = extract_labels(pil_img2)
        if labels1 == "NO_LABELS" and labels2 == "NO_LABELS":
            return 1.0   # neither has labels → no penalty
        if labels1 == "NO_LABELS" or labels2 == "NO_LABELS":
            return 0.0   
        e1 = sbert_model.encode(labels1, convert_to_tensor=True)
        e2 = sbert_model.encode(labels2, convert_to_tensor=True)

        score = util.pytorch_cos_sim(e1, e2).item()
        return max(0.0, score)   # clamp negatives to 0
    except Exception as e:
        print(f"OCR label similarity error: {e}")
        return 0.0

# ------------------------
# Advanced Diagram Similarity (Multi-Model Fusion) ✅
#
# Weighted combination:
#   CLIP  (semantic)   → 35%
#   DINO  (visual)     → 30%
#   ORB   (structural) → 20%
#   OCR   (labels)     → 15%
#
# Falls back gracefully when a model is unavailable.
# Returns a normalised score in [0, 1].
# ------------------------
def advanced_diagram_similarity(pil_img1, pil_img2):
    weights = {"clip": 0.35, "dino": 0.30, "orb": 0.20, "ocr": 0.15}
    scores = {}

    scores["clip"] = clip_similarity(pil_img1, pil_img2)
    scores["dino"] = dino_similarity(pil_img1, pil_img2)
    scores["orb"]  = orb_similarity(pil_img1, pil_img2)
    scores["ocr"]  = ocr_label_similarity(pil_img1, pil_img2)

    # Re-normalise weights for any unavailable model (score == 0 due to import fail)
    active_weight_sum = sum(
        w for k, w in weights.items()
        if not (k == "clip" and not _CLIP_AVAILABLE)
        and not (k == "dino" and not _DINO_AVAILABLE)
    )

    combined = 0.0
    for k, w in weights.items():
        # Skip models that failed to load — don't penalise the student
        if k == "clip" and not _CLIP_AVAILABLE:
            continue
        if k == "dino" and not _DINO_AVAILABLE:
            continue
        normalised_w = w / active_weight_sum if active_weight_sum > 0 else 0
        combined += normalised_w * scores[k]

    print(
        f"📊 Diagram scores → CLIP: {scores['clip']:.3f}, "
        f"DINO: {scores['dino']:.3f}, ORB: {scores['orb']:.3f}, "
        f"OCR: {scores['ocr']:.3f} → Combined: {combined:.3f}"
    )
    return combined


# ------------------------
# diagram_marks ✅
# Converts the combined [0,1] diagram similarity to marks out of 10.
# Same scale as existing image_marks() for consistency.
# ------------------------
def diagram_marks(score):
    if score > 0.85:
        return 10
    elif score > 0.70:
        return 8
    elif score > 0.55:
        return 6
    elif score > 0.40:
        return 4
    elif score > 0.25:
        return 2
    else:
        return 0

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
    question_counter = 1

    # ✅ Compare page-wise, but split each page into individual questions
    for page_idx, (student_page_text, teacher_page_text) in enumerate(
        zip(extracted_answers, teacher_answers)
    ):
        # ── Split text into per-question segments ──
        teacher_questions = split_text_by_questions(teacher_page_text)
        student_questions = split_text_by_questions(student_page_text)

        num_questions = max(len(teacher_questions), len(student_questions))

        # ── Split page images into per-question strips ──
        teacher_img_full = teacher_page_images.get(page_idx)
        student_img_full = student_page_images.get(page_idx)

        teacher_strips = split_image_by_question_count(teacher_img_full, num_questions) if teacher_img_full else [None] * num_questions
        student_strips = split_image_by_question_count(student_img_full, num_questions) if student_img_full else [None] * num_questions

        # Pad shorter list so zip works safely
        while len(teacher_questions) < num_questions:
            teacher_questions.append((len(teacher_questions) + 1, ""))
        while len(student_questions) < num_questions:
            student_questions.append((len(student_questions) + 1, ""))

        # ── Evaluate each question on this page ──
        for q_idx in range(num_questions):
            _, teacher_text = teacher_questions[q_idx]
            _, student_text = student_questions[q_idx]

            teacher_img = teacher_strips[q_idx] if q_idx < len(teacher_strips) else None
            student_img = student_strips[q_idx] if q_idx < len(student_strips) else None

            # ── Determine what content exists in this question strip ──
            has_meaningful_text = bool(
                student_text.strip()
                and student_text not in ("NO_TEXT_DETECTED", "OCR_ERROR", "EXTRACTION_ERROR")
                and len(student_text.strip()) > 5
            )

            has_visual = False
            evaluation_type = "text"
            img_sim = 0.0
            img_score = 0

            if teacher_img is not None and student_img is not None:
                has_diagram = detect_diagram(teacher_img) or detect_diagram(student_img)
                if has_diagram:
                    has_visual = True
                    diag_sim = advanced_diagram_similarity(teacher_img, student_img)
                    img_score = diagram_marks(diag_sim)
                    img_sim = round(diag_sim, 3)
                    evaluation_type = "diagram" if not has_meaningful_text else "mixed_diagram"
                else:
                    # Check whether the strip has any non-trivial image content
                    # (pure white / near-blank strips → no visual to evaluate)
                    img_arr = cv2.cvtColor(np.array(teacher_img), cv2.COLOR_RGB2GRAY)
                    non_white = np.sum(img_arr < 240) / img_arr.size
                    if non_white > 0.02:          # >2% non-white pixels → real image content
                        has_visual = True
                        raw_sim = image_similarity(student_img, teacher_img)
                        img_score = image_marks(raw_sim)
                        img_sim = round(raw_sim, 3)
                        evaluation_type = "image" if not has_meaningful_text else "mixed_image"

            # ── Compute text score only when there is text to evaluate ──
            if has_meaningful_text:
                similarity_score, contextual_score = bert_similarity(student_text, teacher_text)
                text_score = 10 * (
                    0.4 * (similarity_score / 100) + 0.6 * (contextual_score / 100)
                )
            else:
                similarity_score, contextual_score, text_score = 0.0, 0.0, 0.0

            # ── Final score based on content type ──
            if has_meaningful_text and has_visual:
                # Mixed: 70% text + 30% image/diagram
                final_score = round((0.7 * text_score) + (0.3 * img_score), 1)
                # Normalise evaluation_type label for the frontend
                evaluation_type = "diagram" if "diagram" in evaluation_type else "image"
            elif has_meaningful_text:
                # Text only: 100% text score
                final_score = round(text_score, 1)
                evaluation_type = "text"
            elif has_visual:
                # Visual only: 100% image/diagram score
                final_score = round(float(img_score), 1)
                evaluation_type = "diagram" if "diagram" in evaluation_type else "image"
            else:
                # Nothing detected
                final_score = 0.0
                evaluation_type = "none"

            comparisons[question_counter] = {
                "student_text": student_text if has_meaningful_text else "",
                "teacher_text": teacher_text if has_meaningful_text else "",
                "similarity_score": round(similarity_score, 1) if has_meaningful_text else 0,
                "contextual_score": round(contextual_score, 1) if has_meaningful_text else 0,
                "text_marks": round(text_score, 1) if has_meaningful_text else 0,
                "image_similarity": img_sim,
                "image_marks": img_score,
                "evaluation_type": evaluation_type,
                "total_score": final_score,
            }

            question_counter += 1

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
    question_counter = 1

    for page_idx, (student_page_text, teacher_page_text) in enumerate(
        zip(extracted_answers, teacher_answers)
    ):
        teacher_questions = split_text_by_questions(teacher_page_text)
        student_questions = split_text_by_questions(student_page_text)

        num_questions = max(len(teacher_questions), len(student_questions))

        teacher_img_full = teacher_page_images.get(page_idx)
        student_img_full = student_page_images.get(page_idx)

        teacher_strips = split_image_by_question_count(teacher_img_full, num_questions) if teacher_img_full else [None] * num_questions
        student_strips = split_image_by_question_count(student_img_full, num_questions) if student_img_full else [None] * num_questions

        while len(teacher_questions) < num_questions:
            teacher_questions.append((len(teacher_questions) + 1, ""))
        while len(student_questions) < num_questions:
            student_questions.append((len(student_questions) + 1, ""))

        for q_idx in range(num_questions):
            _, teacher_text = teacher_questions[q_idx]
            _, student_text = student_questions[q_idx]

            teacher_img = teacher_strips[q_idx] if q_idx < len(teacher_strips) else None
            student_img = student_strips[q_idx] if q_idx < len(student_strips) else None

            has_meaningful_text = bool(
                student_text.strip()
                and student_text not in ("NO_TEXT_DETECTED", "OCR_ERROR", "EXTRACTION_ERROR")
                and len(student_text.strip()) > 5
            )

            has_visual = False
            evaluation_type = "text"
            img_sim = 0.0
            img_score = 0

            if teacher_img is not None and student_img is not None:
                has_diagram = detect_diagram(teacher_img) or detect_diagram(student_img)
                if has_diagram:
                    has_visual = True
                    diag_sim = advanced_diagram_similarity(teacher_img, student_img)
                    img_score = diagram_marks(diag_sim)
                    img_sim = round(diag_sim, 3)
                    evaluation_type = "diagram" if not has_meaningful_text else "mixed_diagram"
                else:
                    img_arr = cv2.cvtColor(np.array(teacher_img), cv2.COLOR_RGB2GRAY)
                    non_white = np.sum(img_arr < 240) / img_arr.size
                    if non_white > 0.02:
                        has_visual = True
                        raw_sim = image_similarity(student_img, teacher_img)
                        img_score = image_marks(raw_sim)
                        img_sim = round(raw_sim, 3)
                        evaluation_type = "image" if not has_meaningful_text else "mixed_image"

            if has_meaningful_text:
                similarity_score, contextual_score = bert_similarity(student_text, teacher_text)
                text_score = 10 * (0.4 * (similarity_score / 100) + 0.6 * (contextual_score / 100))
            else:
                similarity_score, contextual_score, text_score = 0.0, 0.0, 0.0

            if has_meaningful_text and has_visual:
                final_score = round((0.7 * text_score) + (0.3 * img_score), 1)
                evaluation_type = "diagram" if "diagram" in evaluation_type else "image"
            elif has_meaningful_text:
                final_score = round(text_score, 1)
                evaluation_type = "text"
            elif has_visual:
                final_score = round(float(img_score), 1)
                evaluation_type = "diagram" if "diagram" in evaluation_type else "image"
            else:
                final_score = 0.0
                evaluation_type = "none"

            comparisons[question_counter] = {
                "student_text": student_text if has_meaningful_text else "",
                "teacher_text": teacher_text if has_meaningful_text else "",
                "text_marks": round(text_score, 1) if has_meaningful_text else 0,
                "image_marks": img_score,
                "evaluation_type": evaluation_type,
                "final_score": final_score,
            }

            question_counter += 1

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
