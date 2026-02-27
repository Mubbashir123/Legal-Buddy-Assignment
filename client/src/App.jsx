import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return;
    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);
    if (documentId.trim()) formData.append("documentId", documentId.trim());

    try {
      const res = await fetch("http://localhost:5000/api/documents/upload", {
        method: "POST",
        headers: {
          "x-tenant-id": "tenant-1",
          "x-user-id": "user-1"
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Upload failed");
      } else {
        setStatus(
          `Uploaded document ${data.document.id} v${data.version.versionNumber}`
        );
        setDocumentId(data.document.id);
      }
    } catch (err) {
      setStatus("Network error");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Multi-Tenant Document Repository</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Document ID (optional for new version):{" "}
            <input
              type="text"
              value={documentId}
              onChange={e => setDocumentId(e.target.value)}
              placeholder="Leave blank for new document"
            />
          </label>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="file"
            onChange={e => setFile(e.target.files[0] || null)}
          />
        </div>
        <button type="submit" disabled={!file}>
          Upload
        </button>
      </form>
      {status && (
        <p style={{ marginTop: "1rem" }}>
          {status}
        </p>
      )}
    </div>
  );
}

export default App;

