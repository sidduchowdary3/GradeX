import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, Upload, Award } from "lucide-react";
import TeacherUpload from "./TeacherUpload";
import StudentUpload from "./StudentUpload";
import Results from "./Results";

function App() {
  const [isTeacherUploaded, setIsTeacherUploaded] = useState(false);
  const [comparisons, setComparisons] = useState(null);
  const [loading, setLoading] = useState(false);
  const [student_name, setStudentName] = useState("");
  const [roll_number, setRollNumber] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-indigo-50 to-purple-50">
      

      {/* Main Content */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Answer Sheet Evaluation System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Streamline your grading process with our intelligent evaluation system.
            Fast, accurate, and reliable results.
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
            <div className="bg-white rounded-lg p-8 shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-700 font-medium">Processing your request...</p>
            </div>
          </motion.div>
        )}

        {/* Main Content Area */}
        <motion.div
          className="w-full mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {!isTeacherUploaded ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <Upload className="h-12 w-12 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                  Teacher Answer Upload
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <TeacherUpload
                    setIsTeacherUploaded={setIsTeacherUploaded}
                    setLoading={setLoading}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-center mb-6">
                    <FileCheck className="h-12 w-12 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                    Student Answer Upload
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <StudentUpload
                      setComparisons={setComparisons}
                      setLoading={setLoading}
                      setStudentName={setStudentName}
                      setRollNumber={setRollNumber}
                    />
                  </div>
                </div>
              </motion.div>

              {comparisons && (
                <motion.div
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-center mb-6">
                      <Award className="h-12 w-12 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                      Evaluation Results
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6">
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

export default App;