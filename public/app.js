const chatStore = window.APIKeyValidatorChatStore;

const state = {
  apiKey: "",
  provider: "",
  providerLabel: "",
  checked: [],
  models: [],
  selectedModel: "",
  selectedLabel: "",
  messages: [],
  loading: false
};

const els = {
  brandButton: document.querySelector("#brandButton"),
  headerReportButton: document.querySelector("#headerReportButton"),
  detectedProvider: document.querySelector("#detectedProvider"),
  apiKey: document.querySelector("#apiKey"),
  authButton: document.querySelector("#authButton"),
  clearKeyButton: document.querySelector("#clearKeyButton"),
  modelList: document.querySelector("#modelList"),
  activeModel: document.querySelector("#activeModel"),
  clearChatButton: document.querySelector("#clearChatButton"),
  messages: document.querySelector("#messages"),
  chatForm: document.querySelector("#chatForm"),
  prompt: document.querySelector("#prompt"),
  sendButton: document.querySelector("#sendButton"),
  reportModal: document.querySelector("#reportModal"),
  closeReportButton: document.querySelector("#closeReportButton"),
  reportSubtitle: document.querySelector("#reportSubtitle"),
  reportModelList: document.querySelector("#reportModelList"),
  programName: document.querySelector("#programName"),
  reporterField: document.querySelector("#reporterField"),
  severityField: document.querySelector("#severityField"),
  assetLocation: document.querySelector("#assetLocation"),
  exposureType: document.querySelector("#exposureType"),
  evidenceNotes: document.querySelector("#evidenceNotes"),
  generateReportButton: document.querySelector("#generateReportButton"),
  copyReportButton: document.querySelector("#copyReportButton"),
  exportMarkdownButton: document.querySelector("#exportMarkdownButton"),
  exportHtmlButton: document.querySelector("#exportHtmlButton"),
  exportPdfButton: document.querySelector("#exportPdfButton"),
  reportOutput: document.querySelector("#reportOutput")
};

const START_ROWS = [
  "Google",
  "OpenAI",
  "Anthropic",
  "DeepSeek",
  "Slack",
  "GitHub",
  "Stripe",
  "Cloudflare",
  "AWS"
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isChatCapable(model) {
  return Boolean(model?.available) && model.chatCapable !== false && model.type !== "credential";
}

function currentChatContext(modelId = state.selectedModel) {
  return {
    provider: state.provider,
    model: modelId,
    apiKey: state.apiKey
  };
}

function loadSelectedMessages() {
  state.messages = state.selectedModel && chatStore
    ? chatStore.loadChat(currentChatContext())
    : [];
}

function saveSelectedMessages() {
  if (!state.selectedModel || !chatStore) return;
  chatStore.saveChat(currentChatContext(), state.messages);
}

function resizePrompt() {
  els.prompt.style.height = "auto";
  els.prompt.style.height = `${Math.min(els.prompt.scrollHeight, 140)}px`;
}

function showToast(message) {
  const previous = document.querySelector(".toast");
  if (previous) previous.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4600);
}

function setLoading(loading) {
  state.loading = loading;
  els.authButton.disabled = loading;
  els.sendButton.disabled = loading || !state.selectedModel;
}

function renderDetector() {
  if (!state.providerLabel) {
    els.detectedProvider.className = "detector-strip";
    els.detectedProvider.textContent = "AUTO DETECT";
    return;
  }
  els.detectedProvider.className = "detector-strip detected";
  els.detectedProvider.textContent = `${state.providerLabel} DETECTED`;
}

function renderSkeletonModels() {
  els.modelList.innerHTML = START_ROWS.map(
    (label) => `
      <button class="model-row" type="button" disabled>
        <span class="model-name">${escapeHtml(label)}</span>
        <span class="status-dot"></span>
      </button>
    `
  ).join("");
}

function renderModels() {
  if (!state.models.length) {
    renderSkeletonModels();
    return;
  }

  els.modelList.innerHTML = state.models.map((model) => {
    const active = model.id === state.selectedModel ? " active" : "";
    const available = model.available ? " available" : "";
    const canChat = isChatCapable(model);
    const disabled = canChat ? "" : " disabled";
    const capability = canChat ? "chat available" : model.available ? "validated, no chat" : "unavailable";
    return `
      <button class="model-row${active}" type="button" data-model="${escapeHtml(model.id)}"${disabled} title="${escapeHtml(`${model.id} ${capability}`)}">
        <span class="model-name">${escapeHtml(model.label)}</span>
        <span class="status-dot${available}"></span>
      </button>
    `;
  }).join("");
}

function renderHeader() {
  const modelText = state.selectedLabel || "NO CHAT MODEL SELECTED";
  els.activeModel.textContent = state.providerLabel ? `${state.providerLabel} / ${modelText}` : modelText;
}

function renderMessages() {
  if (!state.messages.length) {
    const hasValidatedCredential = state.models.some((model) => model.available && !isChatCapable(model));
    els.messages.innerHTML = `<div class="empty-state">${
      state.selectedModel
        ? "Type a command to continue this model chat."
        : hasValidatedCredential
          ? "Credential validated. Generate a report from the header."
          : "Enter a key to auto-detect provider and models."
    }</div>`;
    return;
  }

  els.messages.innerHTML = state.messages.map((message) => `
    <article class="message ${escapeHtml(message.role)}">${escapeHtml(message.text)}</article>
  `).join("");
  els.messages.scrollTop = els.messages.scrollHeight;
}

function renderReportModels() {
  if (!state.models.length) {
    els.reportModelList.innerHTML = `<div class="empty-state">Authenticate a key first.</div>`;
    return;
  }

  els.reportModelList.innerHTML = state.models.map((model) => `
    <div class="report-model-row${model.available ? " available" : ""}">
      <span class="report-model-name" title="${escapeHtml(model.detail || model.id)}">${escapeHtml(model.label)}</span>
      <span class="status-dot${model.available ? " available" : ""}"></span>
    </div>
  `).join("");
}

function availableModels() {
  return state.models.filter((model) => model.available);
}

function selectModel(modelId) {
  const model = state.models.find((item) => item.id === modelId);
  if (!isChatCapable(model)) {
    showToast("This credential check is not a chat-capable model.");
    return;
  }
  state.selectedModel = model.id;
  state.selectedLabel = model.label;
  loadSelectedMessages();
  renderModels();
  renderHeader();
  renderMessages();
  setLoading(false);
  els.prompt.focus();
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with ${response.status}`);
  }
  return data;
}

async function authenticate() {
  const apiKey = els.apiKey.value.trim();
  if (!apiKey) {
    showToast("Enter an API key first.");
    els.apiKey.focus();
    return;
  }

  setLoading(true);
  els.authButton.textContent = "CHECKING";
  els.detectedProvider.textContent = "CHECKING PROVIDERS";
  els.detectedProvider.className = "detector-strip";

  try {
    const data = await postJson("/api/models", { apiKey });
    state.apiKey = apiKey;
    state.provider = data.provider || "";
    state.providerLabel = data.providerLabel || "";
    state.checked = data.checked || [];
    state.models = data.models || [];
    const firstChat = state.models.find((model) => isChatCapable(model));
    state.selectedModel = firstChat?.id || "";
    state.selectedLabel = firstChat?.label || "";
    loadSelectedMessages();
    renderDetector();
    renderModels();
    renderHeader();
    renderMessages();
    renderReportModels();
    const checked = state.checked.length ? ` Checked: ${state.checked.join(", ")}.` : "";
    const available = availableModels().length;
    showToast(`${state.providerLabel} key detected with ${available} available check${available === 1 ? "" : "s"}.${checked}`);
  } catch (error) {
    state.apiKey = "";
    state.provider = "";
    state.providerLabel = "";
    state.checked = [];
    state.models = [];
    state.selectedModel = "";
    state.selectedLabel = "";
    state.messages = [];
    renderDetector();
    renderModels();
    renderHeader();
    renderMessages();
    renderReportModels();
    showToast(error.message);
  } finally {
    els.authButton.textContent = "AUTHENTICATE";
    setLoading(false);
  }
}

function clearApiKey() {
  state.apiKey = "";
  state.provider = "";
  state.providerLabel = "";
  state.checked = [];
  state.models = [];
  state.selectedModel = "";
  state.selectedLabel = "";
  state.messages = [];
  els.apiKey.value = "";
  renderDetector();
  renderModels();
  renderHeader();
  renderMessages();
  renderReportModels();
  setLoading(false);
  els.apiKey.focus();
}

function clearChat() {
  if (state.selectedModel && chatStore) chatStore.clearChat(currentChatContext());
  state.messages = [];
  renderMessages();
  els.prompt.focus();
}

async function sendMessage(event) {
  event.preventDefault();
  const message = els.prompt.value.trim();
  if (!message) return;
  if (!state.apiKey || !state.provider) {
    showToast("Authenticate an API key first.");
    return;
  }
  const model = state.models.find((item) => item.id === state.selectedModel);
  if (!isChatCapable(model)) {
    showToast("Select a chat-capable model first.");
    return;
  }

  const history = state.messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role, text: item.text }));

  state.messages.push({ role: "user", text: message });
  saveSelectedMessages();
  els.prompt.value = "";
  resizePrompt();
  renderMessages();
  setLoading(true);

  try {
    const data = await postJson("/api/chat", {
      apiKey: state.apiKey,
      provider: state.provider,
      model: state.selectedModel,
      history,
      message
    });
    state.messages.push({ role: "assistant", text: data.reply || "No reply returned." });
  } catch (error) {
    state.messages.push({ role: "error", text: error.message });
  } finally {
    saveSelectedMessages();
    setLoading(false);
    renderMessages();
    els.prompt.focus();
  }
}

function openReportModal() {
  renderReportModels();
  const available = availableModels();
  els.reportSubtitle.textContent = state.providerLabel
    ? `${state.providerLabel}: ${available.length} available check${available.length === 1 ? "" : "s"}`
    : "Authenticate a key to build a provider-specific report.";
  els.reportModal.hidden = false;
  els.programName.focus();
}

function closeReportModal() {
  els.reportModal.hidden = true;
  els.brandButton.focus();
}

function modelLinesForReport() {
  const models = availableModels();
  if (!models.length) return "- No provider access or chat-capable models were confirmed yet.";
  return models.map((model) => `- ${model.label} (\`${model.id}\`)${model.detail ? ` - ${model.detail}` : ""}`).join("\n");
}

function buildReport() {
  const provider = state.providerLabel || "Unknown provider";
  const checked = state.checked.length ? state.checked.join(" -> ") : "Google, OpenAI, Anthropic, DeepSeek, Slack, GitHub, Stripe, Cloudflare, AWS, and other supported companies";
  const models = availableModels();
  const program = els.programName.value.trim() || "[Program / company]";
  const reporter = els.reporterField.value.trim() || "[Reporter / handle]";
  const severity = els.severityField.value || "High";
  const asset = els.assetLocation.value.trim() || "[Affected asset / URL / repository path]";
  const exposure = els.exposureType.value;
  const notes = els.evidenceNotes.value.trim() || "[Add masked key prefix, exact file/URL, commit, timestamp, and scope notes. Do not include the full secret.]";
  const title = `Exposed ${provider} API Credential Allows Unauthorized Provider Access`;
  const costImpact = models.length
    ? `The exposed credential validated against ${models.length} ${provider} check${models.length === 1 ? "" : "s"}. An attacker may be able to consume quota, trigger billing, exhaust rate limits, access provider metadata, or use any confirmed chat-capable models. Exact financial impact depends on provider pricing, model selection, token volume, quota settings, and billing limits.`
    : "The credential format was detected but provider access has not been confirmed. The secret should still be treated as compromised until it is revoked and provider logs are reviewed.";

  els.reportOutput.value = `# ${title}

## Title
${title}

## Severity
${severity}

## Summary
An exposed ${provider} credential was identified for ${program}. The key was checked using a non-destructive validation flow across supported companies.

Reporter: ${reporter}

## Steps to Reproduce
1. Locate the exposed credential in the affected asset.
2. Record only a masked version of the secret in evidence.
3. Submit the credential to APIKeyValidator validation.
4. Confirm the detected provider and available checks/models.
5. Avoid destructive prompts, high-volume requests, or actions outside the program scope.

## Impact
${costImpact}

Confirmed checks/models:
${modelLinesForReport()}

## Evidence
- Affected asset: ${asset}
- Exposure type: ${exposure}
- Detection path: ${checked}
- Detected provider: ${provider}
- Notes: ${notes}

## Screenshots
- [Add screenshot of the exposed location with the secret masked]
- [Add screenshot of APIKeyValidator validation output]

## Recommended Fix
1. Revoke or rotate the exposed credential immediately.
2. Remove the secret from the exposed asset and deployed artifacts.
3. Purge the secret from commit history, caches, build logs, and release bundles where applicable.
4. Review provider audit logs, quota activity, and billing for unauthorized usage since first exposure.
5. Restrict replacement credentials by project, scope, environment, IP/referrer, budget, and quota where supported.
6. Add secret scanning in repositories, CI/CD, and deployment pipelines.

## Timeline
- Discovery: [YYYY-MM-DD HH:MM UTC]
- Report submitted: [YYYY-MM-DD HH:MM UTC]
- Vendor acknowledged: [YYYY-MM-DD HH:MM UTC]
- Fixed/rotated: [YYYY-MM-DD HH:MM UTC]

## References
- OWASP Secrets Management Cheat Sheet
- GitHub secret scanning remediation guidance
- Provider documentation for ${provider}

## Responsible Usage
Validation was limited to provider identification and low-impact model/access checks. No attempt was made to bypass authorization, exfiltrate data, or consume significant paid resources.`;
  showToast("Markdown report generated.");
}

async function copyReport() {
  if (!els.reportOutput.value.trim()) buildReport();
  try {
    await navigator.clipboard.writeText(els.reportOutput.value);
    showToast("Report copied.");
  } catch {
    els.reportOutput.select();
    document.execCommand("copy");
    showToast("Report copied.");
  }
}

function reportFilename(extension) {
  const provider = (state.providerLabel || "provider").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `apikeyvalidator-${provider || "provider"}-report.${extension}`;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ensureReport() {
  if (!els.reportOutput.value.trim()) buildReport();
  return els.reportOutput.value;
}

function exportMarkdown() {
  const report = ensureReport();
  downloadBlob(reportFilename("md"), new Blob([report], { type: "text/markdown;charset=utf-8" }));
}

function exportHtml() {
  const report = ensureReport();
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>APIKeyValidator Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.55; margin: 40px; color: #171923; }
    pre { white-space: pre-wrap; font-family: inherit; }
  </style>
</head>
<body><pre>${escapeHtml(report)}</pre></body>
</html>`;
  downloadBlob(reportFilename("html"), new Blob([html], { type: "text/html;charset=utf-8" }));
}

function wrapPdfLine(line, width = 92) {
  const words = line.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function pdfEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createPdfBlob(text) {
  const sourceLines = text.split("\n").flatMap((line) => wrapPdfLine(line));
  const pages = [];
  while (sourceLines.length) pages.push(sourceLines.splice(0, 44));

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];
  for (const pageLines of pages) {
    const stream = [
      "BT",
      "/F1 10 Tf",
      "50 770 Td",
      "14 TL",
      ...pageLines.map((line) => `(${pdfEscape(line)}) Tj T*`),
      "ET"
    ].join("\n");
    const streamId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`));
  }

  const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  for (const pageId of pageIds) {
    objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
  }
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function exportPdf() {
  const report = ensureReport();
  downloadBlob(reportFilename("pdf"), createPdfBlob(report));
}

els.authButton.addEventListener("click", authenticate);
els.clearKeyButton.addEventListener("click", clearApiKey);
els.clearChatButton.addEventListener("click", clearChat);
els.chatForm.addEventListener("submit", sendMessage);
els.brandButton.addEventListener("click", openReportModal);
els.headerReportButton.addEventListener("click", openReportModal);
els.closeReportButton.addEventListener("click", closeReportModal);
els.generateReportButton.addEventListener("click", buildReport);
els.copyReportButton.addEventListener("click", copyReport);
els.exportMarkdownButton.addEventListener("click", exportMarkdown);
els.exportHtmlButton.addEventListener("click", exportHtml);
els.exportPdfButton.addEventListener("click", exportPdf);
els.reportModal.addEventListener("click", (event) => {
  if (event.target === els.reportModal) closeReportModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.reportModal.hidden) closeReportModal();
});
els.prompt.addEventListener("input", resizePrompt);
els.prompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    els.chatForm.requestSubmit();
  }
});
els.modelList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-model]");
  if (!row) return;
  selectModel(row.dataset.model);
});

renderDetector();
renderSkeletonModels();
renderHeader();
renderMessages();
renderReportModels();
setLoading(false);
