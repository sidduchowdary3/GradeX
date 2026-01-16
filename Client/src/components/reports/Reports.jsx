import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FileText, RefreshCcw } from "lucide-react";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:5000/reports");
      setReports(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch reports ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ✅ Format date nicely
  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString();
  };

  // ✅ Remove duplicates (keep latest)
  const uniqueSortedReports = useMemo(() => {
    const map = new Map();

    reports.forEach((r) => {
      const exam = r.exam_name || r.examName || "N/A";
      const roll = r.roll_number || "N/A";
      const key = `${exam}__${roll}`;

      const time = new Date(r.created_at || r.date || 0).getTime();

      if (!map.has(key)) {
        map.set(key, r);
      } else {
        const old = map.get(key);
        const oldTime = new Date(old.created_at || old.date || 0).getTime();

        // keep latest one
        if (time > oldTime) map.set(key, r);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.created_at || a.date || 0).getTime();
      const dateB = new Date(b.created_at || b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [reports]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-14">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" />
              Reports
            </h1>
            <p className="text-gray-600 mt-2">
              View previously saved student evaluation reports exam-wise.
            </p>
          </div>

          <button
            onClick={fetchReports}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition flex items-center gap-2 w-fit"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-semibold">Loading reports...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto bg-white">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                      Exam
                    </th>
                    <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                      Date
                    </th>
                    <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                      Roll Number
                    </th>
                    <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                      Student Name
                    </th>
                    <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                      Total Marks
                    </th>
                    <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                      Max Marks
                    </th>
                    <th className="py-3 px-6 text-center text-sm font-bold uppercase">
                      Percentage
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {uniqueSortedReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-gray-600">
                        No reports found yet ✅ <br />
                        Evaluate a student to generate a report.
                      </td>
                    </tr>
                  ) : (
                    uniqueSortedReports.map((r, index) => (
                      <tr
                        key={index}
                        className="border-t hover:bg-indigo-50/40 transition"
                      >
                        <td className="py-3 px-6 text-center font-semibold text-gray-800">
                          {r.exam_name || r.examName || "N/A"}
                        </td>

                        <td className="py-3 px-6 text-center text-sm text-gray-600">
                          {formatDate(r.created_at || r.date)}
                        </td>

                        <td className="py-3 px-6 text-center font-semibold">
                          {r.roll_number || "N/A"}
                        </td>

                        <td className="py-3 px-6 text-center">
                          {r.student_name || "N/A"}
                        </td>

                        <td className="py-3 px-6 text-center">
                          {r.total_marks ?? "N/A"}
                        </td>

                        <td className="py-3 px-6 text-center">
                          {r.max_marks ?? "N/A"}
                        </td>

                        <td className="py-3 px-6 text-center font-extrabold text-indigo-600">
                          {r.percentage ?? "N/A"}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
