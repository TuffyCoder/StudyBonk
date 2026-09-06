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
  // Tried in order if OpenAI says the current default is unavailable for the key.
  const MODEL_FALLBACKS = ["gpt-4.1-mini", "gpt-3.5-turbo"];
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
    keyEnvCheck();
    if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
      throw new Error("That doesn't look like an OpenAI API key (they start with sk-)");
    }
    // verify the key with a tiny real request before saving
    await testKey(key);
    const enc = await window.SB.crypto.encryptString(JSON.stringify({ key }));
    window.SB.storage.set(KEY_STORE, enc);
    return true;
  }

  async function clearKey() {
    window.SB.storage.remove(KEY_STORE);
  }

  function keyEnvCheck() {
    if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) {
      throw new Error("Your browser can't encrypt here — open StudyBonk over HTTPS (or localhost) and try again");
    }
  }

  async function testKey(key) {
    let res;
    try {
      res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: "Bearer " + key },
      });
    } catch (e) {
      throw new Error("Couldn't reach OpenAI — check your internet, VPN or ad-blocker and try again");
    }
    if (res.status === 401) throw new Error("OpenAI rejected that key — make sure you copied the full sk- key from platform.openai.com/api-keys");
    if (!res.ok) throw new Error("OpenAI responded with HTTP " + res.status + " — try again in a moment");
    return true;
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
    const models = [opts.model || DEFAULT_MODEL].concat(MODEL_FALLBACKS.filter((m) => m !== (opts.model || DEFAULT_MODEL)));
    let res, lastErr = "";
    for (const model of models) {
      res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature != null ? opts.temperature : 0.5,
          max_tokens: opts.maxTokens || 700,
        }),
      });
      if (res.ok) break;
      let msg = "HTTP " + res.status;
      try {
        const err = await res.json();
        if (err && err.error && err.error.message) msg = err.error.message;
      } catch (e) { /* keep status */ }
      lastErr = msg;
      // only a missing/retired model is worth retrying with the next candidate
      if (!/model|deprecat/i.test(msg)) break;
    }
    if (!res.ok) {
      throw new Error(lastErr.slice(0, 160));
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
