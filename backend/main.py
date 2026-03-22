import os
import time
from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pypdf import PdfReader

MAX_PDF_SIZE_MB = int(os.getenv("MAX_PDF_SIZE_MB", "20"))
MAX_PDF_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024


class ConvertResponse(BaseModel):
    markdown: str
    metadata: dict[str, Any] | None = None


app = FastAPI(title="PDF to Markdown API", version="0.2.0")

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




@app.get("/app.js")
def serve_app_js() -> FileResponse | PlainTextResponse:
    app_js = FRONTEND_DIR / "app.js"
    if not app_js.exists():
        return PlainTextResponse("console.error(\"app.js not found\")", media_type="application/javascript", status_code=404)
    return FileResponse(app_js, media_type="application/javascript")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/convert", response_model=ConvertResponse)
async def convert_pdf(file: UploadFile = File(...)) -> ConvertResponse:
    started = time.perf_counter()

    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    file_size_bytes = len(raw)
    if file_size_bytes > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large ({file_size_bytes / (1024 * 1024):.2f} MB). "
                f"Current server limit is {MAX_PDF_SIZE_MB} MB."
            ),
        )

    try:
        reader = PdfReader(BytesIO(raw))
    except Exception as exc:  # pragma: no cover - defensive error handling
        raise HTTPException(status_code=400, detail="Invalid PDF file.") from exc

    sections: list[str] = []

    for idx, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if not text:
            text = "_No extractable text found on this page._"
        sections.append(f"## Page {idx}\n\n{text}")

    markdown = "# Converted Markdown\n\n" + "\n\n".join(sections)
    elapsed = round(time.perf_counter() - started, 3)

    metadata = {
        "page_count": len(reader.pages),
        # Figure extraction is intentionally not implemented in this minimal example.
        "figure_count": 0,
        "file_size_mb": round(file_size_bytes / (1024 * 1024), 3),
        "processing_seconds": elapsed,
        "character_count": len(markdown),
        "server_limit_mb": MAX_PDF_SIZE_MB,
    }

    return ConvertResponse(markdown=markdown, metadata=metadata)
