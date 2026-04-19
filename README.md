# 📘 GradeX – Multimodal AI Answer Evaluation System

## 🚀 Overview
GradeX is an intelligent, AI-powered system designed to automatically evaluate handwritten student answers, including both textual and diagrammatic responses. It combines Natural Language Processing (NLP) and Computer Vision (CV) to deliver fast, consistent, and unbiased grading.

Traditional evaluation is slow and subjective. GradeX provides a scalable, automated, and accurate solution for modern educational needs.

---

## 🎯 Key Features

### 📝 Text Evaluation
- Semantic similarity using Sentence-BERT (SBERT)
- Fine-grained analysis with Cross-Encoder models

### 🖼️ Diagram Evaluation
- Structural matching using ORB
- Visual embeddings with DINO
- Semantic understanding via CLIP
- OCR-based label extraction

### 🔍 Hybrid OCR System
- Tesseract OCR for printed text
- Vision-based OCR for handwritten content

### ⚖️ Hybrid Scoring Mechanism
- Combines text + diagram evaluation
- Dynamic weight allocation (e.g., 70% text, 30% diagram)

### 🌐 Web-Based Application
- Teacher answer upload
- Student submission
- Automated evaluation & report generation

---

## 🧠 System Architecture

The system follows a modular pipeline:

- **Input Module** → Upload student & teacher PDFs  
- **Processing Module** → Convert PDFs to images (PyMuPDF)  
- **OCR Module** → Extract text using hybrid OCR  
- **Evaluation Module** → NLP (text) + CV (diagrams)  
- **Scoring Module** → Weighted scoring  
- **Output Module** → Generate reports & store results  

---

## ⚙️ Tech Stack

| Category              | Technologies Used |
|----------------------|------------------|
| 🔹 Backend           | Python, Flask |
| 🔹 NLP               | Sentence-BERT (SBERT), Hugging Face Transformers, NLTK |
| 🔹 Computer Vision   | OpenCV, ORB, DINO, CLIP |
| 🔹 OCR               | Tesseract OCR, Vision-based OCR (Gemini API) |
| 🔹 Database          | MongoDB |
| 🔹 Frontend          | HTML, CSS, JavaScript / React |
---

## 📊 How It Works

- Text is evaluated based on meaning, not keywords  
- Diagrams are evaluated based on structure + semantics  
- Final score reflects overall understanding  

---

## 📈 Results
- High accuracy in semantic text evaluation  
- Robust diagram evaluation  
- Faster grading than manual methods  
- Reduced human bias  

---

## 📌 Use Cases
- Universities & Colleges  
- Schools  
- Online Examination Platforms  
- Competitive Exams  

---

## 🔮 Future Enhancements
- Real-time handwriting recognition  
- Multi-language support  
- Advanced diagram understanding  
- LMS integration  

---

## 👨‍💻 Contributors

| Name                         | Email                     |
|------------------------------|--------------------------|
| Y. Siddhartha Sai Venkat     | sidduyalamanchili3@gmail.com  |
| P. Harshavardhan            | Harshabambu@gmail.com  |
| S. Mohit                    | sasanammohit123@gmail.com  |
| Sd. Latheef Ahmmad          | Syedlatheefahmmad7@gmail.com  |

---

## 📄 Paper Acceptance  

We are proud to announce that our research paper titled  
**"GradeX: A Multimodal AI System for Automated Student Answer Evaluation"**  
has been **accepted for presentation at the ICIRCA 2026 Conference** 🎉  

This achievement highlights the project’s contribution to advancing **AI-driven educational technologies**, particularly in automating and improving the evaluation of student responses.  
