import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import axios from "axios";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:8070";

const TestRow = ({ item }) => {
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  // A stable test id guard (must be a 24-char hex string)
  const testId = useMemo(() => {
    const id = item?._id ? String(item._id) : "";
    return id.length === 24 ? id : null;
  }, [item?._id]);

  useEffect(() => {
    if (!testId) return; // don't fetch until we have a valid ObjectId
    let cancelled = false;

    const getReport = async () => {
      setLoadingReport(true);
      setReportError("");
      try {
        const res = await axios.get(`${API_BASE}/report/getByTest/${testId}`);
        if (!cancelled) {
          setReport(res.data?.report ?? null);
        }
      } catch (err) {
        // 404 means: no report yet. Treat as non-fatal.
        const status = err?.response?.status;
        if (status === 404) {
          if (!cancelled) {
            setReport(null);
          }
        } else {
          console.error("getByTest failed:", err);
          if (!cancelled) {
            setReportError("Failed to load report");
          }
        }
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    };

    getReport();
    return () => {
      cancelled = true;
    };
  }, [testId]);

  const deleteTest = async () => {
    if (!testId) return;
    try {
      await axios.delete(`${API_BASE}/test/delete/${testId}`);
      alert("Test Deleted!");
      // Ideally trigger parent refresh via a prop callback
    } catch (error) {
      console.error(error);
      alert("Failed to delete test");
    }
  };

  // helper to load logo into dataURL
  const loadLogo = () =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = "/images/Hospital-logo-W.png";
    });

  const downloadReport = async () => {
    if (!report) {
      alert("No report available to download yet.");
      return;
    }

    const doc = new jsPDF();
    const margin = 10;
    const pdfWidth = doc.internal.pageSize.getWidth();

    const dateStr = item?.date ? new Date(item.date).toLocaleString() : "N/A";
    const text = `
Test ID : ${item?._id ?? "N/A"}
Patient ID : ${item?.patient ?? "N/A"}
Name : ${item?.name ?? "N/A"}
Test Date : ${dateStr}
Test Type : ${item?.type ?? "N/A"}

Report
--------
Report Id : ${report?._id ?? "N/A"}
Result : ${report?.result ?? "N/A"}
Details : ${report?.details ?? "N/A"}
`;

    const splitText = doc.splitTextToSize(
      text,
      doc.internal.pageSize.width - margin * 2
    );
    doc.text(splitText, margin, 60);

    // Add header with logo (best-effort)
    try {
      const logoDataURL = await loadLogo();
      // keep logo proportional at quarter width
      const imgWidth = pdfWidth / 4;
      doc.addImage(logoDataURL, "PNG", 5, 5, imgWidth, imgWidth * 0.35); // 0.35 is a typical logo ratio guess
    } catch {
      // skip logo on failure
    }

    doc.text(
      "Helasuwa.lk \nTel: 0771231231 \nAddress: No:11, Kandy road",
      pdfWidth / 4 + 15,
      20
    );

    doc.save(`${report?._id || "report"}.pdf`);
  };

  const isSampleProvided = item?.status === "Sample Provided";
  const canRenderReportButtons = !!report && !loadingReport;

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-100">
      <td className="py-4 px-6">{item?._id}</td>
      <td className="py-4 px-6">{item?.patient}</td>
      <td className="py-4 px-6">{item?.name}</td>
      <td className="py-4 px-6">{item?.age}</td>
      <td className="py-4 px-6">
        {item?.date ? new Date(item.date).toDateString() : "N/A"}
      </td>
      <td className="py-4 px-6">{item?.type}</td>
      <td className="py-4 px-6">{item?.status}</td>

      {isSampleProvided ? (
        <td className="py-4 px-6">
          <a href={`/addReport/${item?._id}/${item?.patient}`}>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200">
              Add Report
            </button>
          </a>
        </td>
      ) : (
        <td className="py-4 px-6 flex items-center space-x-2">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 disabled:opacity-50"
            onClick={downloadReport}
            disabled={!canRenderReportButtons}
            title={
              loadingReport
                ? "Loading report..."
                : report
                ? "Download report PDF"
                : "No report available yet"
            }
          >
            {loadingReport ? "Loading..." : "Report"}
          </button>

          <a href={`/editReport/${item?._id}/${item?.patient}`}>
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-200 disabled:opacity-50"
              disabled={!report}
              title={report ? "Edit report" : "No report available yet"}
            >
              Edit Report
            </button>
          </a>

          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
            onClick={deleteTest}
            disabled={!testId}
          >
            Delete
          </button>

          {reportError && (
            <span className="text-sm text-red-600 ml-2">{reportError}</span>
          )}
        </td>
      )}
    </tr>
  );
};

export default TestRow;
