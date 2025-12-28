import { NextPage } from "next";
import { useEffect, useState } from "react";

const IndexPage: NextPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment-logs");
      const data = await response.json();
      console.log(data);
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "status-success";
      case "FAILED":
        return "status-failed";
      default:
        return "status-pending";
    }
  };

  return (
    <div className="audit-container">
      <div className="audit-header">
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Payment Audit Logs</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            Historical record of all Razorpay payment attempts.
          </p>
        </div>
        <button className="refresh-button" onClick={fetchLogs} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Logs"}
        </button>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Saleor Trans. ID</th>
              <th>RZP Order ID</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                  No payment history found in database.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <code>{log.id}</code>
                  </td>
                  <td style={{ color: log.saleorTransactionId ? "inherit" : "#ef4444" }}>
                    {log.saleorTransactionId || "MISSING_ID"}
                  </td>
                  <td>{log.externalOrderId}</td>
                  <td>
                    <span className={`status-chip ${getStatusClass(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {log.amount} {log.currency}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndexPage;
