/* StudyBonk storage layer — everything lives in localStorage on the user's
 * device. Nothing ever leaves the browser. A tiny AES-GCM helper provides
 * client-side encryption for sensitive values (e.g. AI chat memory). */
(function () {
  "use strict";
  window.SB = window.SB || {};
  const PREFIX = "sb.";
  const KEYNAME = PREFIX + "devicekey";

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch {}
    },
    keys() {
      const out = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
        }
      } catch {}
      return out;
    },
    exportAll() {
      const data = {};
      for (const k of store.keys()) data[k] = store.get(k, null);
      return JSON.stringify({ app: "StudyBonk", version: 1, data }, null, 2);
    },
    importAll(json) {
      const parsed = JSON.parse(json);
      if (!parsed || parsed.app !== "StudyBonk" || !parsed.data) {
        throw new Error("Not a StudyBonk export file");
      }
      for (const [k, v] of Object.entries(parsed.data)) store.set(k, v);
      return true;
    },
    clearAll() {
      for (const k of store.keys()) store.remove(k);
    },
  };

  /* ---- Client-side encryption (AES-GCM via WebCrypto) ----
   * The key never leaves this device; this protects saved data from casual
   * inspection by other local users/scripts, not from the device owner. */
  const enc = {
    async _key() {
      let b64 = localStorage.getItem(KEYNAME);
      if (!b64) {
        const raw = crypto.getRandomValues(new Uint8Array(32));
        b64 = btoa(String.fromCharCode(...raw));
        localStorage.setItem(KEYNAME, b64);
      }
      const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
    },
    async encryptString(text) {
      const key = await enc._key();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const buf = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(text)
      );
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      return btoa(JSON.stringify({ iv: [...iv], data: btoa(bin) }));
    },
    async decryptString(payload) {
      try {
        const key = await enc._key();
        const parsed = JSON.parse(atob(payload));
        const buf = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(parsed.iv) },
          key,
          Uint8Array.from(atob(parsed.data), (c) => c.charCodeAt(0))
        );
        return new TextDecoder().decode(buf);
      } catch {
        return null;
      }
    },
  };

  window.SB.storage = store;
  window.SB.crypto = enc;
})();
