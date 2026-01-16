import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, Upload, Award } from "lucide-react";
import TeacherUpload from "./TeacherUpload";
import StudentUpload from "./StudentUpload";
import Results from "./Results";

function Home() {
  const [isTeacherUploaded, setIsTeacherUploaded] = useState(false);
  const [comparisons, setComparisons] = useState(null);
  const [loading, setLoading] = useState(false);
  const [student_name, setStudentName] = useState("");
  const [roll_number, setRollNumber] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-14">
        
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
            Grade<span className="text-indigo-600">X</span> Evaluation Dashboard
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload teacher model answers, evaluate student sheets, and generate results
            instantly with AI-powered grading.
          </p>
        </motion.div>

        {/* Loading Overlay */}
        {loading && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-800 font-semibold">
                Processing your request...
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Please wait a moment 🚀
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Flow */}
        <motion.div
          className="w-full mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {!isTeacherUploaded ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/30 overflow-hidden">
              <div className="p-8 sm:p-10">
                {/* Icon */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-2">
                  Teacher Upload
                </h2>

                <p className="text-center text-gray-600 mb-8">
                  Upload the model answer sheet to start evaluation.
                </p>

                <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <TeacherUpload
                    setIsTeacherUploaded={setIsTeacherUploaded}
                    setLoading={setLoading}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Student Upload */}
              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/30 overflow-hidden mb-10"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="p-8 sm:p-10">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                      <FileCheck className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-2">
                    Student Upload
                  </h2>

                  <p className="text-center text-gray-600 mb-8">
                    Upload student answers and generate AI-based evaluation results.
                  </p>

                  <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <StudentUpload
                      setComparisons={setComparisons}
                      setLoading={setLoading}
                      setStudentName={setStudentName}
                      setRollNumber={setRollNumber}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Results */}
              {comparisons && (
                <motion.div
                  className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/30 overflow-hidden"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="p-8 sm:p-10">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-2">
                      Evaluation Results
                    </h2>

                    <p className="text-center text-gray-600 mb-8">
                      View detailed scoring, feedback and performance analytics.
                    </p>

                    <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <Results
                        comparisons={comparisons}
                        studentName={student_name}
                        rollNumber={roll_number}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
