from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import fitz  # PyMuPDF - pip install pymupdf
import pytesseract  # pip install pytesseract + install tesseract binary
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
from io import BytesIO

def clean_for_handwriting(pil_img):
    img = np.array(pil_img)

    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (3,3), 0)

    # better for ink
    thresh = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        15, 4
    )

    return Image.fromarray(thresh)

processing_mode = None

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
client = MongoClient("mongodb://localhost:27017/")

# Download necessary NLTK resources
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('punkt_tab', quiet=True)

# Initialize NLP tools
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words("english"))
negation_words = {"not", "never", "no", "none", "cannot", "n't"}

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Models
sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

cross_encoder_model = AutoModelForSequenceClassification.from_pretrained("cross-encoder/stsb-roberta-large")
cross_encoder_tokenizer = AutoTokenizer.from_pretrained("cross-encoder/stsb-roberta-large")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
teacher_answers = {}
exam_name = None
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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

    inputs = cross_encoder_tokenizer(student_answer_clean, original_answer_clean, return_tensors="pt", truncation=True)
    with torch.no_grad():
        logits = cross_encoder_model(**inputs).logits
    context_score = torch.sigmoid(logits).item() * 100

    student_has_negation = contains_negation(student_answer)
    original_has_negation = contains_negation(original_answer)
    if student_has_negation != original_has_negation:
        similarity *= 0.5
        context_score *= 0.5

    return similarity, context_score

def extract_text_from_image(image):
    try:
        response = gemini_client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=[
                "You are an OCR engine. Read this handwritten answer sheet. "
                "Extract ALL visible handwritten text exactly as written. "
                "Do NOT summarize. Do NOT explain. Output only the raw text.",
                image
            ]
        )

        text = response.text.strip()

        if len(text) < 5:
            return "NO_TEXT_DETECTED"

        return text

    except Exception as e:
        print("Gemini OCR failed:", e)
        return "OCR_ERROR"




def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    extracted_text_list = []
    for i, page in enumerate(doc):
        try:
            print(f"Processing Page {i + 1}...")
            pix = page.get_pixmap(matrix=fitz.Matrix(4, 4))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            if processing_mode == "teacher":
                text = pytesseract.image_to_string(img).strip()
            else:  # student: enhance + Gemini
                clean_img = clean_for_handwriting(img)
                text = extract_text_from_image(clean_img)
            
            extracted_text_list.append(text if text else "NO_TEXT_DETECTED")
        except Exception as e:
            print(f"Page {i+1} failed: {e}")
            extracted_text_list.append("EXTRACTION_ERROR")
    doc.close()
    return extracted_text_list



from flask import request, jsonify
import os

@app.route('/mongodb/databases', methods=['GET'])
def get_databases():
    try:
        databases = client.list_database_names()
        return jsonify({"databases": databases}), 200
    except Exception as e:
        print(f"Error fetching databases: {e}")
        return jsonify({"error": "Failed to fetch databases"}), 500


@app.route('/mongodb/collection-data', methods=['POST'])
def get_collection_data():
    try:
        # Extract database name from the request body
        data = request.json
        database_name = data.get("database")

        # Validate the input
        if not database_name:
            return jsonify({"error": "Database name is required"}), 400

        # Access the database and the 'reports' collection
        db = client[database_name]
        collection_name = "reports"
        collection = db[collection_name]

        # Fetch all documents from the collection
        collection_data = list(collection.find({}, {"_id": 0}))  # Exclude '_id' if not required in output

        return jsonify({"collection_name": collection_name, "data": collection_data}), 200
    except Exception as e:
        # Print error details and send a failure response
        print(f"Error fetching collection data: {e}")
        return jsonify({"error": "Failed to fetch collection data"}), 500



# Routes remain mostly same, but fix upload_student_pdf_api scoring to match HTML
@app.route('/upload/teacher', methods=['POST'])
def upload_teacher_pdf():
    global processing_mode, exam_name
    if 'pdf' not in request.files or 'examName' not in request.form:
        return jsonify({"error": "Missing file or exam name"}), 400
    
    exam_name = request.form['examName']
    pdf_file = request.files['pdf']
    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_file.filename)
    pdf_file.save(pdf_path)
    
    processing_mode = "teacher"
    global teacher_answers
    teacher_answers = extract_text_from_pdf(pdf_path)
    
    return jsonify({"message": "Teacher answers uploaded", "examName": exam_name, "pages": len(teacher_answers)})



@app.route('/upload/student', methods=['POST'])
def upload_student_pdf():
    """
    Endpoint to upload a student's PDF, extract answers, and compare with teacher's answers.
    """

    # 🔥 VERY IMPORTANT — switch to student mode
    global processing_mode
    processing_mode = "student"

    if 'pdf' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    pdf_file = request.files['pdf']
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], pdf_file.filename)
    pdf_file.save(pdf_path)

    # 🔥 This will now use Gemini OCR
    extracted_answers = extract_text_from_pdf(pdf_path)

    comparisons = {}
    for page, (student_text, teacher_text) in enumerate(zip(extracted_answers, teacher_answers), start=1):
        similarity_score, contextual_score = bert_similarity(student_text, teacher_text)

        sbert_normalized = similarity_score / 100
        cross_encoder_normalized = contextual_score / 100

        W1 = 0.4
        W2 = 0.6

        total_score = 10 * ((W1 * sbert_normalized) + (W2 * cross_encoder_normalized))

        comparisons[page] = {
            "student_text": student_text,
            "teacher_text": teacher_text,
            "similarity_score": similarity_score,
            "contextual_score": contextual_score,
            "total_score": round(total_score, 0)
        }

    return render_template("result.html", comparisons=comparisons)



@app.route('/upload/student_api', methods=['POST'])
def upload_student_pdf_api():
    global processing_mode
    processing_mode = "student"
    
    student_name = request.form.get('studentName')
    roll_number = request.form.get('rollNumber')
    if 'pdf' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    pdf_file = request.files['pdf']
    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_file.filename)
    pdf_file.save(pdf_path)
    
    extracted_answers = extract_text_from_pdf(pdf_path)
    comparisons = {}
    for page, (student_text, teacher_text) in enumerate(zip(extracted_answers, teacher_answers), 1):
        similarity_score, contextual_score = bert_similarity(student_text, teacher_text)
        # Fixed: Consistent weighted scoring (0-10 scale)
        sbert_norm = similarity_score / 100
        context_norm = contextual_score / 100
        W1, W2 = 0.4, 0.6
        total_score = 10 * (W1 * sbert_norm + W2 * context_norm)
        comparisons[page] = {
            "student_text": student_text,
            "teacher_text": teacher_text,
            "similarity_score": round(similarity_score, 1),
            "contextual_score": round(contextual_score, 1),
            "total_score": round(total_score, 0)
        }
    
    return jsonify({"student_name": student_name, "roll_number": roll_number, "comparisons": comparisons})

@app.route("/save-report", methods=["POST"])
def save_report():
    try:
        data = request.json
        # Create/access a database named after the exam name
        db = client[exam_name]
        collection = db["reports"]  # Use a "reports" collection for the data

        # Insert the report data into MongoDB
        collection.insert_one(data)
        return jsonify({"message": f"Report saved successfully in {exam_name} database!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Failed to save the report"}), 500


@app.route("/reset/teacher", methods=["GET"])
def reset_teacher():
    global teacher_answers
    teacher_answers = None
    return jsonify({"message": "Teacher answers reset successfully"})


if __name__ == '__main__':
    app.run(debug=True)