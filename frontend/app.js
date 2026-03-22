const apiBaseUrl = window.location.origin;

const pdfInput = document.getElementById("pdfInput");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const markdownOutput = document.getElementById("markdownOutput");
const statusEl = document.getElementById("status");
const metadataEl = document.getElementById("metadata");

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b00020" : "#1f2937";
};

convertBtn.addEventListener("click", async () => {
  const file = pdfInput.files[0];

  if (!file) {
    setStatus("Select a PDF file before converting.", true);
    return;
  }

  const form = new FormData();
  form.append("file", file);

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
      throw new Error(err.detail || "Conversion failed.");
    }

    const data = await res.json();
    markdownOutput.value = data.markdown || "";

    if (data.metadata) {
      const pageCount = data.metadata.page_count ?? "n/a";
      const figureCount = data.metadata.figure_count ?? "n/a";
      metadataEl.textContent = `Pages: ${pageCount} • Figures: ${figureCount}`;
    }

    downloadBtn.disabled = !markdownOutput.value;
    setStatus("Conversion complete.");
  } catch (error) {
    setStatus(error.message || "Unknown error.", true);
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
