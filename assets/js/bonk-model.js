/* StudyBonk "Bonk AI" engine — OpenAI API edition.
 *
 * Instant Mode needs nothing but this site. AI generation (flashcards,
 * quizzes, chat) connects to the OpenAI API using the USER'S OWN free API
 * key: the key is stored encrypted (AES-GCM, device-local) in localStorage,
 * requests go directly from the browser to api.openai.com, and StudyBonk
 * has no server in the middle. Used by /ai/, /flashcards/ and /quiz/. */
(function () {
  "use strict";
  window.SB = window.SB || {};

  const API_URL = "https://api.openai.com/v1/chat/completions";
  const DEFAULT_MODEL = "gpt-4o-mini";
  const KEY_STORE = "api.enc";

  const hasWebGPU = () => !!navigator.gpu; // kept for UI compat

  /* ---------- key management (encrypted local storage) ---------- */

  async function getKey() {
    const enc = window.SB.storage.get(KEY_STORE, null);
    if (!enc) return null;
    const plain = await window.SB.crypto.decryptString(enc);
    if (!plain) return null;
    try { return JSON.parse(plain).key || null; } catch (e) { return null; }
  }

  async function setKey(key) {
    key = String(key || "").trim();
    if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
      throw new Error("That doesn't look like an OpenAI API key (they start with sk-)");
    }
    // verify the key with a tiny real request before saving
    const ok = await testKey(key);
    if (!ok) throw new Error("OpenAI rejected that key — double-check it and try again");
    const enc = await window.SB.crypto.encryptString(JSON.stringify({ key }));
    window.SB.storage.set(KEY_STORE, enc);
    return true;
  }

  async function clearKey() {
    window.SB.storage.remove(KEY_STORE);
  }

  async function testKey(key) {
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: "Bearer " + key },
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  /* ---------- interface compatible with the old local engine ---------- */

  async function load(kindIgnored, onProgress) {
    const key = await getKey();
    if (!key) throw new Error("No API key connected yet");
    if (onProgress) onProgress(1, "Connected to OpenAI");
    return info();
  }

  async function generate(messages, opts) {
    opts = opts || {};
    const key = await getKey();
    if (!key) throw new Error("No API key connected — open the Bonk AI page to connect one");
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: opts.model || DEFAULT_MODEL,
        messages,
        temperature: opts.temperature != null ? opts.temperature : 0.5,
        max_tokens: opts.maxTokens || 700,
      }),
    });
    if (!res.ok) {
      let msg = "HTTP " + res.status;
      try {
        const err = await res.json();
        if (err && err.error && err.error.message) msg = err.error.message;
      } catch (e) { /* keep status */ }
      throw new Error(msg.slice(0, 160));
    }
    const data = await res.json();
    const out = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
    const text = String(out).trim();
    if (opts.onToken && text) opts.onToken(text, text);
    return text;
  }

  function info() {
    return {
      kind: "api",
      name: "Bonk AI",
      model: { name: "Bonk AI", engine: "openai-api" },
      ready: false, // synchronous guess; use isReady()
      webgpuAvailable: hasWebGPU(),
    };
  }

  async function isReady() {
    return !!(await getKey());
  }

  window.SB.model = { hasWebGPU, load, generate, info, isReady, getKey, setKey, clearKey, DEFAULT_MODEL };
})();
