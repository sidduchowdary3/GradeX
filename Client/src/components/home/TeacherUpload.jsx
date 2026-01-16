import React, { useState, useEffect } from "react";
import axios from "axios";

function TeacherUpload({ setIsTeacherUploaded, setLoading }) {
  const [uploading, setUploading] = useState(false);
  const [examName, setExamName] = useState("");
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [collectionData, setCollectionData] = useState([]);
  const [uniquePages, setUniquePages] = useState([]);

  const staticColumns = ["total_marks", "max_marks", "percentage"];

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:5000/mongodb/databases"
        );
        setDatabases(response.data.databases || []);
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
        const response = await axios.post(
          "http://127.0.0.1:5000/mongodb/collection-data",
          { database: selectedDatabase }
        );

        const data = response.data.data || [];
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
      {/* Exam + DB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Database Select */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Database
          </label>
          <select
            value={selectedDatabase}
            onChange={(e) => setSelectedDatabase(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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

      {/* Collection Data */}
      {selectedDatabase && collectionData?.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-md p-8">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6">
            Previous Evaluations
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                    Roll Number
                  </th>
                  <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                    Student Name
                  </th>

                  {uniquePages?.map((page, index) => (
                    <th
                      key={`page-${page}-${index}`}
                      className="py-3 px-6 text-center text-sm font-bold uppercase"
                    >
                      Page {page}
                    </th>
                  ))}

                  {staticColumns.map((col, index) => (
                    <th
                      key={index}
                      className="py-3 px-6 text-center text-sm font-bold uppercase"
                    >
                      {col.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {collectionData?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-t hover:bg-indigo-50/50 transition-colors"
                  >
                    <td className="py-3 px-6 text-center">
                      {row.roll_number || "N/A"}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {row.student_name || "N/A"}
                    </td>

                    {uniquePages?.map((page, pageIndex) => {
                      const markObj = row.page_marks?.find(
                        (obj) => obj.page === page
                      );
                      return (
                        <td
                          key={`page-${page}-${pageIndex}`}
                          className="py-3 px-6 text-center"
                        >
                          {markObj?.marks ?? "N/A"}
                        </td>
                      );
                    })}

                    {staticColumns.map((col, colIndex) => (
                      <td key={colIndex} className="py-3 px-6 text-center">
                        {row[col] ?? "N/A"}
                      </td>
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
