import { NextPage } from "next";
import { useEffect, useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

const IndexPage: NextPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2s
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
    <div className="audit-main-wrapper">
      <div className="audit-container">
        <div className="audit-header">
          <div className="header-content">
            <h1>Payment Audit Logs</h1>
            <p>Historical record of all Razorpay payment attempts.</p>
          </div>
          <button className="refresh-button" onClick={fetchLogs} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>

        <div className="audit-card">
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Psp Ref No.</th>
                  <th>Saleor Trans. ID</th>
                  <th>RZP Order ID</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="empty-state-cell">
                      No history found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td data-label="Log ID" className="font-mono text-muted">
                        #{log.id}
                      </td>
                      <td data-label="Psp Ref No." className="font-mono text-muted">
                        {log.externalPaymentId || "N/A"}
                      </td>
                      <td data-label="Saleor ID">
                        <div className="id-copy-wrapper">
                          <span
                            className={cn("id-text", !log.saleorTransactionId && "text-critical")}
                          >
                            {log.saleorTransactionId || "N/A"}
                          </span>
                          {log.saleorTransactionId && (
                            <button
                              className="copy-btn"
                              onClick={() => copyToClipboard(log.saleorTransactionId)}
                              title="Copy ID"
                            >
                              {copiedId === log.saleorTransactionId ? (
                                <span className="text-success-vibrant">Copied!</span>
                              ) : (
                                "Copy"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td data-label="RZP Order">{log.externalOrderId}</td>
                      <td data-label="Status">
                        <span className={`status-badge ${getStatusClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td data-label="Amount" className="text-right tabular-nums font-bold">
                        {log.amount} {log.currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple helper for cleaner classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default IndexPage;
