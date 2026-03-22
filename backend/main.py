from io import BytesIO
from typing import Any

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pypdf import PdfReader


class ConvertResponse(BaseModel):
    markdown: str
    metadata: dict[str, Any] | None = None


app = FastAPI(title="PDF to Markdown API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
def serve_index() -> FileResponse:
    index_file = FRONTEND_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend not found.")
    return FileResponse(index_file)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/convert", response_model=ConvertResponse)
async def convert_pdf(file: UploadFile = File(...)) -> ConvertResponse:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        reader = PdfReader(BytesIO(raw))
    except Exception as exc:  # pragma: no cover - defensive error handling
        raise HTTPException(status_code=400, detail="Invalid PDF file.") from exc

    sections: list[str] = []
    page_count = len(reader.pages)

    for idx, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if not text:
            text = "_No extractable text found on this page._"
        sections.append(f"## Page {idx}\n\n{text}")

    markdown = "# Converted Markdown\n\n" + "\n\n".join(sections)

    metadata = {
        "page_count": page_count,
        # Figure extraction is intentionally not implemented in this minimal example.
        "figure_count": 0,
    }

    return ConvertResponse(markdown=markdown, metadata=metadata)
