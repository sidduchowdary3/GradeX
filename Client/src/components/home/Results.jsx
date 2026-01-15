import React from "react";

function Results({ student_name, roll_number, comparisons }) {

  // Calculate cumulative marks
  const cumulativeMarks = Object.values(comparisons).reduce(
    (total, result) => total + result.total_score,
    0
  );

  const maxTotalMarks = Object.keys(comparisons).length * 10;
  // Calculate percentage
  const percentage = ((cumulativeMarks / maxTotalMarks) * 100).toFixed(2);

  const handleSaveReport = async () => {
    // Disable button after clicked to avoid repeated clicks
    const pageMarks = Object.entries(comparisons).map(([page, result]) => ({
      page,
      marks: result.total_score,
    }));

    const reportData = {
      student_name,
      roll_number,
      total_marks: cumulativeMarks,
      max_marks: maxTotalMarks,
      percentage,
      page_marks: pageMarks, // Add page-wise marks here
      details: comparisons,
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/save-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        alert("Report successfully saved!");
      } else {
        alert("Failed to save the report.");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("An error occurred while saving the report.");
    }
  };

  return (
    <div className="p-6 space-y-8 text-gray-800 font-sans">
      <h2 className="text-2xl font-semibold mb-4">Evaluation Results</h2>
      {Object.entries(comparisons).map(([page, result]) => (
        <div key={page} className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Question {page}</h3>
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="p-3 text-center bg-gray-100">Student Text</th>
                <th className="p-3 text-center bg-gray-100">Teacher Text</th>
                <th className="p-3 text-center bg-gray-100">Similarity Score</th>
                <th className="p-3 text-center bg-gray-100">Contextual Score</th>
                <th className="p-3 text-center bg-gray-100">Marks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 text-center">{result.student_text}</td>
                <td className="p-3 text-center">{result.teacher_text}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center gap-2">
                    <progress
                      className="w-24 h-2"
                      max="100"
                      value={result.similarity_score}
                    />
                    <span>{result.similarity_score.toFixed(2)}%</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center gap-2">
                    <progress
                      className="w-24 h-2"
                      max="100"
                      value={result.contextual_score}
                    />
                    <span>{result.contextual_score.toFixed(2)}%</span>
                  </div>
                </td>
                <td className="p-3 text-center">{result.total_score}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {/* Enhanced Report Section */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-4">Student Report</h1>
        <div className="flex flex-wrap gap-6">
          <div className="flex-1">
            <p className="text-lg mb-2">
              <strong>Student Name:</strong> {student_name}
            </p>
            <p className="text-lg mb-2">
              <strong>Roll Number:</strong> {roll_number}
            </p>
            <p className="text-lg mb-2">
              <strong>Total Marks:</strong>{" "}
              <span className="text-blue-600 font-semibold">
                {cumulativeMarks} / {maxTotalMarks}
              </span>
            </p>
            <p className="text-lg mb-4">
              <strong>Total Percentage:</strong>{" "}
              <span className="text-blue-600 font-semibold">{percentage}%</span>
            </p>
          </div>

          <div className="flex-1 text-center">
            <h4 className="text-xl mb-4">Overall Performance</h4>
            <div className="flex flex-col items-center">
              <progress
                className="w-64 h-3 bg-gray-300 rounded-full"
                max="100"
                value={percentage}
              />
              <span className="mt-2 text-2xl font-bold text-blue-600">{percentage}%</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            className="save-report-btn text-white text-2xl font-bold px-6 py-3 cursor-pointer bg-green-700 rounded-lg"
            onClick={handleSaveReport}
          >
            Save Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;
