import React, { useState, useEffect } from "react";
import axios from "axios";

function TeacherUpload({ setIsTeacherUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [examName, setExamName] = useState("");
  const [databases, setDatabases] = useState([]); // Default to empty array
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [collectionData, setCollectionData] = useState([]); // Default to empty array
  const [uniquePages, setUniquePages] = useState([]);

  const staticColumns = ["total_marks", "max_marks", "percentage"];

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/mongodb/databases");
        setDatabases(response.data.databases || []); // Ensure it's an array
      } catch (error) {
        console.error("Error fetching databases:", error);
      }
    };

    fetchDatabases();
  }, []);

  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!selectedDatabase) return;

      try {
        const response = await axios.post("http://127.0.0.1:5000/mongodb/collection-data", {
          database: selectedDatabase,
        });
        const data = response.data.data || []; // Ensure it's an array
        const pages = new Set();
        data.forEach((row) => {
          if (row.page_marks) {
            row.page_marks.forEach((markObj) => pages.add(markObj.page));
          }
        });

        setUniquePages([...pages].sort((a, b) => a - b));
        setCollectionData(data);
      } catch (error) {
        console.error("Error fetching collection data:", error);
        alert("Error fetching collection data. Please try again.");
      }
    };

    fetchCollectionData();
  }, [selectedDatabase]);

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

    if (!examName) {
      alert("Please enter an exam name.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("examName", examName);

    setUploading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/upload/teacher", formData);
      console.log(response);
      alert("KEY uploaded successfully!");
      setIsTeacherUploaded(true);
    } catch (error) {
      console.error(error);
      alert("Error uploading KEY. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-6">
      <div>
        <label htmlFor="exam-name">Exam Name: </label>
        <input
          id="exam-name"
          type="text"
          className="border-3 border-gray-300 rounded-md px-3 py-2 w-full"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="database-select">Select Database: </label>
        <select
          id="database-select"
          value={selectedDatabase}
          onChange={(e) => setSelectedDatabase(e.target.value)}
        >
          <option value="">-- Select --</option>
          {databases.length > 0 ? (
            databases.map((db, index) => (
              <option key={index} value={db}>
                {db}
              </option>
            ))
          ) : (
            <option disabled>No databases available</option>
          )}
        </select>
      </div>

      <h2 className="text-3xl font-semibold text-gray-800 text-center">
        Upload Answer Key
      </h2>

      <div className="flex justify-center">
        <label className="w-full">
          <div className="flex flex-col items-center justify-center py-8 px-6 border-2 border-dashed border-indigo-400 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer bg-white">
            <div className="space-y-2 text-center">
              <p className="text-lg font-medium text-gray-700">
                Upload Answer Key (PDF only)
              </p>
              <p className="text-sm text-gray-500">File size up to 5MB</p>
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

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-semibold text-gray-800">Uploading...</h2>
            <p className="text-lg text-gray-600">Please wait while we process your file.</p>
          </div>
        </div>
      )}

      {selectedDatabase && collectionData?.length > 0 && (
        <div className="collection-table">
          <h3>Collection Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse shadow-md rounded-lg overflow-hidden mx-auto">
              <thead>
                <tr className="bg-green-600 text-white">
                  <th className="py-3 px-6 text-center text-sm font-bold uppercase">Roll Number</th>
                  <th className="py-3 px-6 text-center text-sm font-bold uppercase">Student Name</th>
                  {uniquePages?.map((page, index) => (
                    <th key={`page-${page}-${index}`} className="py-3 px-6 text-center text-sm font-bold uppercase">Page {page} Marks</th>
                  ))}
                  {staticColumns.map((col, index) => (
                    <th key={index} className="py-3 px-6 text-center text-sm font-bold uppercase">{col.replace("_", " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {collectionData?.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t hover:bg-gray-100 transition-colors duration-300">
                    <td className="py-3 px-6 text-center">{row.roll_number || "N/A"}</td>
                    <td className="py-3 px-6 text-center">{row.student_name || "N/A"}</td>
                    {uniquePages?.map((page, pageIndex) => {
                      const markObj = row.page_marks?.find((obj) => obj.page === page);
                      return <td key={`page-${page}-${pageIndex}`} className="py-3 px-6 text-center">{markObj?.marks || "N/A"}</td>;
                    })}
                    {staticColumns.map((col, colIndex) => (
                      <td key={colIndex} className="py-3 px-6 text-center">{row[col] || "N/A"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherUpload;
