# 📄 PDF → AI-Optimized Markdown Converter

Convert technical PDFs into **clean, structured Markdown optimized for AI agents** (RAG systems, agent skills, knowledge bases).

This project focuses on **semantic structure**, not visual replication — making documentation usable for both humans and AI.

---

## 🚀 Overview

This web application allows you to:

- Upload a **technical PDF manual**
- Automatically extract:
  - headings and structure
  - paragraphs and code blocks
  - tables (preserved properly)
  - figures (images + captions)
- Download a **clean `.md` file** ready for:
  - AI agents
  - vector databases
  - documentation systems

---

## 🎯 Why This Exists

Most PDF → text tools produce:

- broken formatting
- lost tables
- missing figures
- unusable content for AI

This project solves that by:

> Treating PDFs as **structured knowledge sources**, not just files.

---

## ✨ Key Features

### 🧠 AI-Optimized Markdown
- Clean heading hierarchy (`#`, `##`, `###`)
- Logical structure reconstruction
- Optional metadata blocks for RAG

### 📊 Table Preservation
- Simple tables → Markdown
- Complex tables → HTML `<table>`
- Multi-page tables merged

### 🖼️ Figure Handling (Critical Feature)
- Images extracted and saved
- Captions preserved
- AI-friendly summaries added

Example:

    ![Figure 2.1](images/fig_2_1.png)

    **Figure 2.1:** Reinforcement mesh on skew tension

    **Figure summary for AI:** Diagram showing how skew tension creates rhomb deformation in reinforcement mesh and requires compression strut action.

### 🧹 Cleanup & Normalization
- Removes headers/footers/page numbers
- Fixes line breaks and hyphenation
- Preserves code blocks

### ⚡ Direct Markdown Download
- No ZIP required
- Ready-to-use `.md` file

---

## 🏗️ Architecture

### Frontend
- React / Next.js
- File upload
- Conversion progress
- Markdown preview (optional)

### Backend
- FastAPI (Python)
- PDF parsing pipeline

### Core Libraries
- pymupdf (fitz) → text, layout, images
- pdfplumber → table extraction
- pytesseract → OCR fallback
- Pillow → image processing

---

## ⚙️ Processing Pipeline

1. PDF Parsing  
   Extract text blocks, images, tables, layout

2. Block Classification  
   Heading, paragraph, table, figure, code

3. Structure Reconstruction  
   Build logical sections (chapters, subsections)

4. Tables Handling  
   Markdown or HTML depending on complexity

5. Figures Handling  
   Extract image + caption  
   Generate AI-friendly description

6. Markdown Generation  
   Clean, structured output

---

## 📦 Output

Primary output:

manual.md

Images:
- Referenced via relative paths or URLs
- Can optionally be downloaded separately

---

## 🧪 Example Use Cases

- Convert engineering manuals (e.g. SOFiSTiK, Eurocode guides)
- Prepare documentation for:
  - AI copilots
  - internal knowledge bases
  - semantic search systems
- Build structured datasets from PDFs

---

## ⚠️ Limitations

- Designed for text-based PDFs (not scanned)
- Complex layouts may require refinement
- Some tables may fall back to HTML

---

## 🔍 Quality Goals

The output should:

- preserve logical structure
- keep tables readable and complete
- retain meaningful figures
- be clean and noise-free
- be usable directly in AI pipelines

---

## ❌ Non-Goals

- Pixel-perfect PDF reproduction
- Pure text dumping
- Ignoring figures or tables

---

## 🛠️ Getting Started

### Easiest (no manual terminal setup)

If you're on Windows, double-click `start_windows.bat` from the project folder.
It will create a virtual environment, install dependencies, start the server, and open your browser automatically.

### One-process local run (serves frontend + backend together)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
python start.py
```

Then open: `http://127.0.0.1:8000`


### Deploy for iPad / public access (Render)

This app must be deployed to a public URL to work on iPad.
Localhost (`127.0.0.1`) only works on the same device running the server.

1. Push this repo to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Render will auto-detect `render.yaml` and build from `Dockerfile`.
4. Once deployed, open your Render URL (for example, `https://pdf2md.onrender.com`) on iPad.

Or run Docker anywhere and expose port `8000` publicly:

```bash
docker build -t pdf2md .
docker run -p 8000:8000 pdf2md
```

Then open `http://<your-server-ip>:8000` (or HTTPS via your platform proxy).

### API Contract

**Endpoint:** `POST /convert`  
**URL:** `https://<your-domain>/convert` (or local `http://127.0.0.1:8000/convert`)  
**Content-Type:** `multipart/form-data`

**Request form field**
- `file`: PDF file upload

**Success response (200)**

```json
{
  "markdown": "# Converted Markdown\n\n## Page 1...",
  "metadata": {
    "page_count": 12,
    "figure_count": 0
  }
}
```

**Error responses**
- `400` when non-PDF or invalid/empty file is uploaded
- `413` when uploaded file exceeds server max size (`MAX_PDF_SIZE_MB`, default 20 MB)

UI now shows conversion-in-progress status, elapsed time, selected file size, and backend processing time/character count metadata to help diagnose slow large files.

---

## 💡 Future Improvements

- RAG-ready chunk export
- JSON structure output
- Multi-file batch processing
- AI-assisted table reconstruction
- Multimodal embeddings support

---

## 🤝 Contributing

Contributions are welcome. Focus areas:

- better table detection
- figure understanding
- performance optimization
- UI/UX improvements

---

## 📌 Philosophy

> A PDF is not a document.  
> It is a compressed knowledge system.

This project exists to decompress it properly.

---

## 📄 License

MIT (or specify your preferred license)
