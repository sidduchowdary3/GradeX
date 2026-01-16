import React, { useState } from "react";
import axios from "axios";
import { FileCheck } from "lucide-react";
import Results from "./Results";

function StudentUpload() {
  const [comparisons, setComparisons] = useState({});
  const [studentDetails, setStudentDetails] = useState({
    student_name: "",
    roll_number: "",
  });

  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [file, setFile] = useState(null);

  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("studentName", name);
    formData.append("rollNumber", rollNo);

    if (file) {
      formData.append("pdf", file);
    }

    setLoading(true);

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
      alert("Student details and answer sheet uploaded successfully ✅");
    } catch (error) {
      console.error(error);
      alert("Error uploading student details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ ONLY FORM HERE */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              placeholder="Enter student name"
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
            />
          </div>

          {/* Roll Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Roll Number
            </label>
            <input
              type="text"
              value={rollNo}
              placeholder="Enter roll number"
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
            />
          </div>
        </div>

        {/* Upload */}
        <div>
          <label className="block cursor-pointer">
            <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-indigo-400/70 rounded-2xl hover:border-indigo-600 transition bg-white">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                <FileCheck className="h-7 w-7 text-white" />
              </div>

              <div className="space-y-1 text-center">
                <p className="text-lg font-semibold text-gray-800">
                  {file ? file.name : "Upload Student Answer Sheet"}
                </p>
                <p className="text-sm text-gray-500">
                  PDF / PNG / JPG (Max 10MB)
                </p>
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

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md hover:opacity-95 hover:shadow-lg transition"
          >
            Submit for Evaluation
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <h2 className="text-xl font-bold text-gray-900 mt-4">
                Uploading...
              </h2>
              <p className="text-gray-600 mt-1">
                Please wait while we evaluate the sheet.
              </p>
            </div>
          </div>
        )}
      </form>

      {/* ✅ RESULTS OUTSIDE FORM (IMPORTANT FIX) */}
      {showResults && (
        <div className="mt-10">
          <Results
            student_name={studentDetails.student_name}
            roll_number={studentDetails.roll_number}
            comparisons={comparisons}
          />
        </div>
      )}
    </>
  );
}

export default StudentUpload;
