(function initChatStore(root) {
  const PREFIX = "apikeyvalidator-chat-v1";

  function hashSecret(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function storageKey({ provider, model, apiKey }) {
    return `${PREFIX}:${provider || "unknown"}:${model || "none"}:${hashSecret(apiKey)}`;
  }

  function safeStorage(storage) {
    if (storage) return storage;
    if (typeof localStorage !== "undefined") return localStorage;
    return null;
  }

  function loadChat(context, storage) {
    const target = safeStorage(storage);
    if (!target) return [];
    try {
      const raw = target.getItem(storageKey(context));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveChat(context, messages, storage) {
    const target = safeStorage(storage);
    if (!target) return;
    target.setItem(storageKey(context), JSON.stringify(Array.isArray(messages) ? messages : []));
  }

  function clearChat(context, storage) {
    const target = safeStorage(storage);
    if (!target) return;
    target.removeItem(storageKey(context));
  }

  const api = { clearChat, hashSecret, loadChat, saveChat, storageKey };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.APIKeyValidatorChatStore = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
