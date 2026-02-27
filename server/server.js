import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const mockDB = {
  tenants: [{ id: "tenant-1", name: "LegalCorp" }],
  users: [{ id: "user-1", tenantId: "tenant-1", role: "admin" }],
  documents: [],
  documentVersions: []
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}-${safe}`);
  }
});

const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const checkAccess = (req, res, next) => {
  const tenantId = req.header("x-tenant-id");
  const userId = req.header("x-user-id");
  const user = mockDB.users.find(u => u.id === userId && u.tenantId === tenantId);
  if (!tenantId || !userId || !user) return res.status(403).json({ error: "Forbidden user" });
  if (!["admin", "editor"].includes(user.role)) return res.status(403).json({ error: "Forbidden" });
  req.tenantId = tenantId;
  req.userId = userId;
  next();
};

const nextId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

app.post(
  "/api/documents/upload",
  checkAccess,
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "File required" });
    const { tenantId, userId } = req;
    const { documentId: rawDocumentId, title: rawTitle } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    let document;
    let version;

    if (rawDocumentId) {
      const documentId = rawDocumentId;
      document = mockDB.documents.find(d => d.id === documentId && d.tenantId === tenantId);

      if (!document) 
      return res.status(404).json({ error: "Document not found for tenant" });

      const versions = mockDB.documentVersions.filter(
        v => v.documentId === documentId && v.tenantId === tenantId
      );
      const maxVersion = versions.reduce((m, v) => Math.max(m, v.versionNumber), 0);
      const versionNumber = maxVersion + 1;
      version = {
        id: nextId("version"),
        documentId,
        tenantId,
        fileUrl,
        versionNumber,
        uploadedBy: userId
      };
      mockDB.documentVersions.push(version);
    } else {
      const id = nextId("doc");
      const title = rawTitle || req.file.originalname;
      document = { id, tenantId, title };
      mockDB.documents.push(document);
      version = {
        id: nextId("version"),
        documentId: id,
        tenantId,
        fileUrl,
        versionNumber: 1,
        uploadedBy: userId
      };
      mockDB.documentVersions.push(version);
    }

    res.status(201).json({ document, version });
  }
);

app.listen(PORT, () => {
  console.log("server listening");
});
