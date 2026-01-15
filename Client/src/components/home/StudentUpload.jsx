import React, { useState } from "react";
import axios from "axios";
import { FileCheck } from 'lucide-react';
import Results from "./Results";

function StudentUpload() {
  const [comparisons, setComparisons] = useState({});
  const [studentDetails, setStudentDetails] = useState({
    student_name: "",
    roll_number: "",
  });
  const [name, setName] = useState(""); // State for student name
  const [rollNo, setRollNo] = useState(""); // State for roll number
  const [file, setFile] = useState(null); // State for file upload
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false); // State for overlay effect

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("studentName", name);
    formData.append("rollNumber", rollNo);
    if (file) {
      formData.append("pdf", file);
    }

    setLoading(true); // Show overlay

    try {
      const response = await axios.post(
        "http://localhost:5000/upload/student_api",
        formData
      );
      setComparisons(response.data.comparisons);
      setStudentDetails({
        student_name: response.data.student_name,
        roll_number: response.data.roll_number,
      });
      setShowResults(true);
      alert("Student details and answer sheet uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Error uploading student details. Please try again.");
    } finally {
      setLoading(false); // Hide overlay
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Student Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700 mb-1">
            Roll Number
          </label>
          <input
            type="text"
            id="rollNo"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block">
          <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer bg-white">
            <FileCheck className="h-12 w-12 text-indigo-500 mb-4" />
            <div className="space-y-2 text-center">
              <p className="text-lg font-medium text-gray-700">
                {file ? file.name : "Upload Student's Answer Sheet"}
              </p>
              <p className="text-sm text-gray-500">PDF or image files up to 10MB</p>
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Submit for Evaluation
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center animate__animated animate__fadeIn animate__faster">
            <h2 className="text-2xl font-semibold text-gray-800">Uploading...</h2>
            <p className="text-lg text-gray-600">Please wait while we process your file.</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {showResults && (
        <Results
          student_name={studentDetails.student_name}
          roll_number={studentDetails.roll_number}
          comparisons={comparisons}
        />
      )}
    </form>
  );
}

export default StudentUpload;
