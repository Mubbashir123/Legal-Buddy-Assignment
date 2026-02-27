# LegalBuddy: Document Repository PoC

A lightweight, proof-of-concept backend and frontend for a centralized, multi-tenant document repository. 

**Note on Database:** To keep this submission highly runnable for evaluation, the database is mocked using in-memory arrays. The data structures are explicitly modeled to map directly to a relational SQL database (like PostgreSQL) for a production environment.

## 1. Architectural Approach


### Multi-Tenancy (Logical Separation)
* **Approach:** Every data entity (Users, Documents, Versions) is strictly scoped to a `tenantId`. 
* **Security:** A custom middleware intercepts all requests, extracting `x-tenant-id` from headers to guarantee operations never cross tenant boundaries.

### Role-Based Access Control (RBAC)
* **Approach:** Access is tied to roles, not individual users. 
* **Security:** The backend validates if the requesting user's role (e.g., `admin`, `editor`) has the necessary permissions for the requested route before executing any core logic.

### Version Management (Evaluation Focus)
To maintain an auditable, immutable ledger of files, the system completely separates metadata from physical files:
* **`Document`:** The parent container holding the original title and tenant ownership.
* **`DocumentVersion`:** The physical file iterations (URL, upload timestamp, uploader ID, and sequential `versionNumber`).
* **Why it's flexible:** Updating a document does not overwrite the old file. It appends a new `DocumentVersion` record linked to the parent `Document`. This creates a perfect chronological history and enables safe rollbacks.

## 2. Tech Stack
* **Frontend:** React.js (Vite)
* **Backend:** Node.js, Express.js
* **Storage:** Local File System via `multer` (Simulating AWS S3 / Cloud Storage)

## 3. Quickstart Guide

### Start the Backend
1. `cd server`
2. `npm install`
3. `npm start` (Runs on http://localhost:5000)

### Start the Frontend
1. Open a new terminal -> `cd client`
2. `npm install`
3. `npm run dev` (Runs on http://localhost:5173)

### How to Test Versioning
1. Open the React app in your browser.
2. Select a file and click **Upload** (This creates a new Document -> `v1`).
3. Copy the generated `documentId` from the success message.
4. Paste that `documentId` into the text input, select a new file, and click **Upload** again.
5. The system will detect the existing document and append a new version (`v2`) to the repository.
