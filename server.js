const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { validateDetectedProvider } = require("./lib/providerRegistry");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8099);
const PUBLIC_DIR = path.join(__dirname, "public");

const PROVIDERS = {
  google: {
    label: "Google",
    catalog: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-001", label: "Gemini 2.0 Flash 001" },
      { id: "gemini-2.0-flash-lite-001", label: "Gemini 2.0 Flash-Lite 001" },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite" },
      { id: "gemma-3-1b-it", label: "Gemma 3 1B" },
      { id: "gemma-3-4b-it", label: "Gemma 3 4B" },
      { id: "gemma-3-12b-it", label: "Gemma 3 12B" },
      { id: "gemma-3-27b-it", label: "Gemma 3 27B" }
    ]
  },
  openai: {
    label: "OpenAI",
    catalog: [
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "gpt-5.4", label: "GPT-5.4" },
      { id: "gpt-5", label: "GPT-5" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "o3", label: "o3" },
      { id: "o4-mini", label: "o4 mini" }
    ]
  },
  anthropic: {
    label: "Anthropic",
    catalog: [
      { id: "claude-opus-4-5", label: "Claude Opus 4.5" },
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
      { id: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet Latest" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku Latest" }
    ]
  },
  deepseek: {
    label: "DeepSeek",
    catalog: [
      { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
      { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
      { id: "deepseek-chat", label: "DeepSeek Chat" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner" }
    ]
  }
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function normalizeModelName(name) {
  return String(name || "").replace(/^models\//, "");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  res.end(message);
}

function safeFilePath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const decodedPath = decodeURIComponent(cleanPath.split("?")[0]);
  const filePath = path.normalize(path.join(PUBLIC_DIR, decodedPath));
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  return filePath;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function getProvider(body) {
  const provider = String(body.provider || "").trim().toLowerCase();
  if (!PROVIDERS[provider]) {
    const error = new Error("Unsupported provider");
    error.statusCode = 400;
    throw error;
  }
  return provider;
}

function getApiKey(body) {
  const apiKey = String(body.apiKey || "").trim();
  if (!apiKey) {
    const error = new Error("API key is required");
    error.statusCode = 400;
    throw error;
  }
  return apiKey;
}

function getModelId(value) {
  const model = normalizeModelName(value).trim();
  if (!/^[A-Za-z0-9._:-]+$/.test(model)) {
    const error = new Error("Invalid model id");
    error.statusCode = 400;
    throw error;
  }
  return model;
}

async function apiFetch(provider, url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.PROVIDER_TIMEOUT_MS || 9000));
  let response;

  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (error) {
    const wrapped = new Error(error.name === "AbortError"
      ? `${PROVIDERS[provider].label} API request timed out`
      : `${PROVIDERS[provider].label} API request failed`);
    wrapped.statusCode = error.name === "AbortError" ? 504 : 502;
    throw wrapped;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.error?.error?.message ||
      data?.message ||
      `${PROVIDERS[provider].label} API request failed with ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function mergeCatalog(provider, apiModels, options = {}) {
  const seen = new Set();
  const modelMap = new Map(apiModels.map((model) => [model.id, model]));
  const models = [];

  for (const item of PROVIDERS[provider].catalog) {
    const apiModel = modelMap.get(item.id);
    seen.add(item.id);
    models.push({
      id: item.id,
      label: apiModel?.label || item.label,
      available: Boolean(apiModel?.available),
      methods: apiModel?.methods || [],
      owner: apiModel?.owner || "",
      source: apiModel ? "api" : "catalog",
      chatCapable: Boolean(apiModel?.available),
      type: "model"
    });
  }

  for (const apiModel of apiModels) {
    if (seen.has(apiModel.id)) continue;
    models.push({
      id: apiModel.id,
      label: apiModel.label || apiModel.id,
      available: Boolean(apiModel.available),
      methods: apiModel.methods || [],
      owner: apiModel.owner || "",
      source: "api",
      chatCapable: Boolean(apiModel.available),
      type: "model"
    });
  }

  if (options.sortAvailableFirst) {
    models.sort((a, b) => Number(b.available) - Number(a.available) || a.label.localeCompare(b.label));
  }

  return models;
}

async function listGoogleModels(apiKey) {
  const data = await apiFetch("google", `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  const apiModels = (Array.isArray(data.models) ? data.models : []).map((model) => {
    const methods = model.supportedGenerationMethods || [];
    return {
      id: normalizeModelName(model.name),
      label: model.displayName || normalizeModelName(model.name),
      available: methods.includes("generateContent"),
      methods,
      owner: "google"
    };
  });
  return mergeCatalog("google", apiModels);
}

async function listOpenAIModels(apiKey) {
  const data = await apiFetch("openai", "https://api.openai.com/v1/models", {
    headers: { authorization: `Bearer ${apiKey}` }
  });
  const apiModels = (Array.isArray(data.data) ? data.data : [])
    .filter((model) => !/(embedding|image|audio|tts|whisper|moderation|transcribe)/i.test(model.id || ""))
    .map((model) => ({
      id: model.id,
      label: model.id,
      available: true,
      methods: ["responses"],
      owner: model.owned_by || "openai"
    }));
  return mergeCatalog("openai", apiModels, { sortAvailableFirst: true });
}

async function listAnthropicModels(apiKey) {
  const data = await apiFetch("anthropic", "https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    }
  });
  const apiModels = (Array.isArray(data.data) ? data.data : []).map((model) => ({
    id: model.id,
    label: model.display_name || model.id,
    available: true,
    methods: ["messages"],
    owner: "anthropic"
  }));
  return mergeCatalog("anthropic", apiModels, { sortAvailableFirst: true });
}

async function listDeepSeekModels(apiKey) {
  const data = await apiFetch("deepseek", "https://api.deepseek.com/models", {
    headers: { authorization: `Bearer ${apiKey}` }
  });
  const apiModels = (Array.isArray(data.data) ? data.data : []).map((model) => ({
    id: model.id,
    label: model.id,
    available: true,
    methods: ["chat.completions"],
    owner: model.owned_by || "deepseek"
  }));
  return mergeCatalog("deepseek", apiModels);
}

function providerDetectionOrder(apiKey) {
  const key = apiKey.toLowerCase();
  const preferred = ["google"];

  if (key.startsWith("sk-ant-")) preferred.push("anthropic");
  if (key.startsWith("sk-")) preferred.push("openai", "deepseek", "anthropic");
  if (key.startsWith("ds-")) preferred.push("deepseek");

  preferred.push("openai", "anthropic", "deepseek");
  return [...new Set(preferred)];
}

async function providerRawRequest(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.PROVIDER_TIMEOUT_MS || 9000));

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {})
      }
    });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    return {
      ok: response.ok,
      status: response.status,
      data,
      text
    };
  } catch (error) {
    return {
      ok: false,
      status: error.name === "AbortError" ? 504 : 0,
      data: {},
      text: error.message || "request failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function detectProviderModels(apiKey) {
  const listModels = {
    google: listGoogleModels,
    openai: listOpenAIModels,
    anthropic: listAnthropicModels,
    deepseek: listDeepSeekModels
  };
  const attempts = [];

  for (const provider of providerDetectionOrder(apiKey)) {
    try {
      const models = await listModels[provider](apiKey);
      return {
        provider,
        providerLabel: PROVIDERS[provider].label,
        models,
        checked: [...attempts.map((attempt) => attempt.provider), provider]
      };
    } catch (error) {
      attempts.push({
        provider,
        statusCode: error.statusCode || 500,
        message: error.message
      });
    }
  }

  const detected = await validateDetectedProvider(apiKey, providerRawRequest);
  if (detected) {
    return {
      ...detected,
      checked: [...attempts.map((attempt) => attempt.provider), detected.provider]
    };
  }

  const error = new Error(
    `Could not identify this key. Checked: ${attempts.map((attempt) => PROVIDERS[attempt.provider].label).join(", ")}.`
  );
  error.statusCode = attempts.find((attempt) => attempt.statusCode === 401)?.statusCode || 400;
  error.attempts = attempts;
  throw error;
}

async function handleModels(req, res) {
  try {
    const body = await readJsonBody(req);
    const apiKey = getApiKey(body);
    const result = await detectProviderModels(apiKey);
    sendJson(res, 200, {
      provider: result.provider,
      providerLabel: result.providerLabel,
      checked: result.checked,
      models: result.models
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Unable to check model access",
      attempts: error.attempts || undefined
    });
  }
}

function safeHistory(history) {
  return (Array.isArray(history) ? history : [])
    .slice(-24)
    .map((entry) => ({
      role: entry?.role === "assistant" || entry?.role === "model" ? "assistant" : "user",
      text: String(entry?.text || "").trim().slice(0, 12000)
    }))
    .filter((entry) => entry.text);
}

function googleContents(history, message) {
  const contents = [];
  for (const entry of safeHistory(history)) {
    contents.push({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: entry.text }]
    });
  }
  contents.push({ role: "user", parts: [{ text: String(message).slice(0, 12000) }] });
  return contents;
}

function chatMessages(history, message) {
  return [
    ...safeHistory(history).map((entry) => ({ role: entry.role, content: entry.text })),
    { role: "user", content: String(message).slice(0, 12000) }
  ];
}

function extractGoogleReply(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part.text || "").join("").trim();
  if (text) return text;
  const finishReason = data?.candidates?.[0]?.finishReason;
  return finishReason ? `No text returned. Finish reason: ${finishReason}` : "No text returned.";
}

function extractOpenAIReply(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("").trim() || "No text returned.";
}

function extractAnthropicReply(data) {
  const chunks = (data.content || [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text);
  return chunks.join("").trim() || "No text returned.";
}

function extractChatCompletionReply(data) {
  return data?.choices?.[0]?.message?.content?.trim() || "No text returned.";
}

async function chatGoogle(apiKey, model, history, message) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const data = await apiFetch("google", url, {
    method: "POST",
    body: JSON.stringify({
      contents: googleContents(history, message),
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096 }
    })
  });
  return extractGoogleReply(data);
}

async function chatOpenAI(apiKey, model, history, message) {
  const data = await apiFetch("openai", "https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      input: chatMessages(history, message),
      max_output_tokens: 4096,
      store: false
    })
  });
  return extractOpenAIReply(data);
}

async function chatAnthropic(apiKey, model, history, message) {
  const data = await apiFetch("anthropic", "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: chatMessages(history, message)
    })
  });
  return extractAnthropicReply(data);
}

async function chatDeepSeek(apiKey, model, history, message) {
  const data = await apiFetch("deepseek", "https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: chatMessages(history, message),
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    })
  });
  return extractChatCompletionReply(data);
}

async function handleChat(req, res) {
  try {
    const body = await readJsonBody(req);
    const provider = getProvider(body);
    const apiKey = getApiKey(body);
    const model = getModelId(body.model);
    const message = String(body.message || "").trim();
    if (!message) {
      sendJson(res, 400, { error: "Message is required" });
      return;
    }

    const chat = {
      google: chatGoogle,
      openai: chatOpenAI,
      anthropic: chatAnthropic,
      deepseek: chatDeepSeek
    }[provider];

    const reply = await chat(apiKey, model, body.history, message);
    sendJson(res, 200, { provider, reply });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Unable to send chat message"
    });
  }
}

function serveStatic(req, res) {
  const filePath = safeFilePath(req.url);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "content-type": MIME_TYPES[ext] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(req.method === "HEAD" ? undefined : data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/models") {
    handleModels(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/chat") {
    handleChat(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }
  sendText(res, 405, "Method not allowed");
});

server.listen(PORT, HOST, () => {
  console.log(`APIKeyValidator listening on http://${HOST}:${PORT}`);
});
