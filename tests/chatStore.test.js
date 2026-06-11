const test = require("node:test");
const assert = require("node:assert/strict");
const {
  clearChat,
  hashSecret,
  loadChat,
  saveChat,
  storageKey
} = require("../public/chat-store");

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value)
  };
}

test("chat storage key does not include raw API key", () => {
  const key = storageKey({ provider: "google", model: "gemini-2.5-flash", apiKey: "secret-api-key" });
  assert.equal(key.includes("secret-api-key"), false);
  assert.equal(key.includes(hashSecret("secret-api-key")), true);
});

test("chat history persists per provider and model", () => {
  const storage = memoryStorage();
  const gemini = { provider: "google", model: "gemini-2.5-flash", apiKey: "same-key" };
  const pro = { provider: "google", model: "gemini-2.5-pro", apiKey: "same-key" };

  saveChat(gemini, [{ role: "user", text: "hi" }], storage);
  saveChat(pro, [{ role: "user", text: "hello pro" }], storage);

  assert.deepEqual(loadChat(gemini, storage), [{ role: "user", text: "hi" }]);
  assert.deepEqual(loadChat(pro, storage), [{ role: "user", text: "hello pro" }]);

  clearChat(gemini, storage);
  assert.deepEqual(loadChat(gemini, storage), []);
  assert.deepEqual(loadChat(pro, storage), [{ role: "user", text: "hello pro" }]);
});
