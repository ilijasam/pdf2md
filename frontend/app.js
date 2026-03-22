const apiBaseUrl = window.location.origin;

const pdfInput = document.getElementById("pdfInput");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const markdownOutput = document.getElementById("markdownOutput");
const statusEl = document.getElementById("status");
const progressEl = document.getElementById("progress");
const metadataEl = document.getElementById("metadata");
const fileInfoEl = document.getElementById("fileInfo");

let timerId;
let dotsId;

const humanSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const metadataEl = document.getElementById("metadata");

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b00020" : "#1f2937";
};

const startProgress = () => {
  const started = Date.now();
  let dots = "";

  progressEl.textContent = "Working";

  timerId = setInterval(() => {
    const sec = ((Date.now() - started) / 1000).toFixed(1);
    progressEl.textContent = `Elapsed: ${sec}s`;
  }, 200);

  dotsId = setInterval(() => {
    dots = dots.length >= 3 ? "" : `${dots}.`;
    setStatus(`Converting${dots}`);
  }, 450);
};

const stopProgress = () => {
  clearInterval(timerId);
  clearInterval(dotsId);
  progressEl.textContent = "";
};

pdfInput.addEventListener("change", () => {
  const file = pdfInput.files[0];
  if (!file) {
    fileInfoEl.textContent = "";
    return;
  }

  fileInfoEl.textContent = `Selected: ${file.name} (${humanSize(file.size)})`;

  if (file.size > 20 * 1024 * 1024) {
    setStatus("Large file warning: files over 20 MB may be rejected by the server.", true);
  } else {
    setStatus("Ready to convert.");
  }
});

convertBtn.addEventListener("click", async () => {
  const file = pdfInput.files[0];

  if (!file) {
    setStatus("Select a PDF file before converting.", true);
    return;
  }

  const form = new FormData();
  form.append("file", file);

  metadataEl.textContent = "";
  downloadBtn.disabled = true;
  convertBtn.disabled = true;
  startProgress();
  setStatus("Converting...");
  metadataEl.textContent = "";
  downloadBtn.disabled = true;

  try {
    const res = await fetch(`${apiBaseUrl}/convert`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Conversion failed (HTTP ${res.status}).`);
      throw new Error(err.detail || "Conversion failed.");
    }

    const data = await res.json();
    markdownOutput.value = data.markdown || "";

    if (data.metadata) {
      const pageCount = data.metadata.page_count ?? "n/a";
      const figureCount = data.metadata.figure_count ?? "n/a";
      const seconds = data.metadata.processing_seconds ?? "n/a";
      const chars = data.metadata.character_count ?? "n/a";
      const mb = data.metadata.file_size_mb ?? "n/a";
      metadataEl.textContent =
        `Pages: ${pageCount} • Figures: ${figureCount} • File: ${mb} MB • Text size: ${chars} chars • Server time: ${seconds}s`;
      metadataEl.textContent = `Pages: ${pageCount} • Figures: ${figureCount}`;
    }

    downloadBtn.disabled = !markdownOutput.value;
    setStatus("Conversion complete.");
  } catch (error) {
    setStatus(error.message || "Unknown error.", true);
  } finally {
    stopProgress();
    convertBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", () => {
  const markdown = markdownOutput.value;
  if (!markdown) {
    setStatus("No markdown to download.", true);
    return;
  }

  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
