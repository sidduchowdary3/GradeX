import React, { useState } from "react";
import axios from "axios";

function TeacherUpload({ setIsTeacherUploaded, setLoading }) {
  const [uploading, setUploading] = useState(false);
  const [examName, setExamName] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];

    if (!file) {
      alert("Please select a file!");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5 MB!");
      return;
    }

    if (!examName.trim()) {
      alert("Please enter an exam name.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("examName", examName);

    setUploading(true);
    if (setLoading) setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/upload/teacher",
        formData
      );

      console.log(response);
      alert("Answer Key uploaded successfully ✅");
      setIsTeacherUploaded(true);
    } catch (error) {
      console.error(error);
      alert("Error uploading Answer Key. Please try again.");
    } finally {
      setUploading(false);
      if (setLoading) setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Exam Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Exam Name
        </label>
        <input
          type="text"
          placeholder="Eg: Mid-1 / Unit Test / Sem Exam"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
        />
      </div>

      {/* Upload Box */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-md p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-2">
          Upload Answer Key
        </h2>
        <p className="text-center text-gray-600 mb-6">
          PDF format only (Max 5MB)
        </p>

        <label className="block w-full cursor-pointer">
          <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-indigo-400/70 rounded-2xl hover:border-indigo-600 transition bg-white">
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-gray-800">
                Click to Upload Answer Key
              </p>
              <p className="text-sm text-gray-500">
                Drag & drop also supported
              </p>
            </div>
          </div>

          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Uploading Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Uploading...
            </h2>
            <p className="text-gray-600 mt-2">
              Please wait while we process the Answer Key.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherUpload;
