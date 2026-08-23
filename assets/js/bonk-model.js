/* StudyBonk "Bonk AI" engine — a real local model, fully in the browser.
 *
 * Primary engine: Gemma 3 1B (GGUF, unsloth UD-Q5_K_XL) running via vendored
 * wllama (llama.cpp WebAssembly) — works on ANY device, WebGPU or not.
 * The ~874 MB GGUF downloads once (with progress), then wllama caches it in
 * IndexedDB for offline use.
 *
 * Fallback engines (if the GGUF path fails):
 *   - WebGPU: vendored WebLLM with a quantized Qwen 2.5 model
 *   - CPU:    vendored Transformers.js + onnx-community/Qwen2.5-0.5B (public)
 *
 * No API, no backend. The only network requests are one-time, opt-in model
 * downloads that contain zero user data. Used by /ai/, the /flashcards/
 * importer and the /quiz/ importer. UI shows only "Bonk AI". */
(function () {
  "use strict";
  window.SB = window.SB || {};

  const GGUF_URL = "https://huggingface.co/unsloth/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-UD-Q5_K_XL.gguf";
  const GGUF_SIZE = 874293536;

  const WEBLLM_MODELS = [
    { key: "lite",  id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC" },
    { key: "core",  id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC" },
  ];
  const WASM_ONNX = { id: "onnx-community/Qwen2.5-0.5B-Instruct", dtype: "q8" };
  const wasmPaths = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/";

  let wllama = null;       // GGUF engine (primary)
  let engine = null;       // webllm engine (fallback)
  let hfPipe = null;       // transformers pipeline (fallback)
  let engineKind = null;   // "gguf" | "webgpu" | "wasm"
  let loading = null;

  const hasWebGPU = () => !!navigator.gpu;

  /* ---------- primary: GGUF via wllama ---------- */
  async function loadGguf(onProgress) {
    const mod = await import("/assets/vendor/wllama.js");
    const wl = new mod.Wllama({ "wllama.wasm": "/assets/vendor/wllama.wasm" });
    await wl.loadModelFromUrl(GGUF_URL, {
      n_ctx: 4096,
      parallelDownloads: 4,
      progressCallback: ({ loaded, total }) => {
        if (onProgress) onProgress(loaded / (total || GGUF_SIZE), "Downloading Bonk AI model — " + Math.round(loaded / 1e6) + " / " + Math.round((total || GGUF_SIZE) / 1e6) + " MB (one-time)");
      },
    });
    wllama = wl;
    engineKind = "gguf";
  }

  /* ---------- fallbacks ---------- */
  async function loadWebLLM(onProgress) {
    const webllm = await import("/assets/vendor/webllm.js");
    engine = await webllm.CreateMLCEngine(WEBLLM_MODELS[1].id, {
      initProgressCallback: (p) => onProgress && onProgress(p.progress || 0, p.text || "Downloading & compiling…"),
    });
    engineKind = "webgpu";
  }

  async function loadOnnx(onProgress) {
    const tr = await import("/assets/vendor/transformers.js.mjs");
    tr.env.allowLocalModels = false;
    if (tr.env.backends && tr.env.backends.onnx && tr.env.backends.onnx.wasm) {
      tr.env.backends.onnx.wasm.wasmPaths = wasmPaths;
    }
    hfPipe = await tr.pipeline("text-generation", WASM_ONNX.id, {
      dtype: WASM_ONNX.dtype,
      progress_callback: (p) => {
        if (p && p.status === "progress" && p.total) {
          onProgress && onProgress(p.loaded / p.total, "Downloading model chunk " + (p.file || "") + "…");
        }
      },
    });
    engineKind = "wasm";
  }

  function clearEngines() {
    wllama = null; engine = null; hfPipe = null; engineKind = null;
  }

  async function load(kindIgnored, onProgress) {
    if (wllama || engine || hfPipe) return info();
    if (loading) return loading;
    loading = (async () => {
      // Primary: the real GGUF model — works everywhere.
      try {
        if (onProgress) onProgress(0, "Starting Bonk AI (Gemma 3 1B, local)…");
        await loadGguf(onProgress);
        return info();
      } catch (e1) {
        clearEngines();
        // Fallback: fastest available engine for this device.
        try {
          if (hasWebGPU()) {
            if (onProgress) onProgress(0, "GGUF engine unavailable — starting the WebGPU engine…");
            await loadWebLLM(onProgress);
          } else {
            if (onProgress) onProgress(0, "GGUF engine unavailable — starting the CPU engine…");
            await loadOnnx(onProgress);
          }
          return info();
        } catch (e2) {
          clearEngines();
          throw new Error(String((e2 && e2.message) || e2 || e1).slice(0, 160));
        }
      } finally {
        loading = null;
      }
    })();
    return loading;
  }

  async function generate(messages, opts) {
    opts = opts || {};
    if (wllama) {
      const res = await wllama.createChatCompletion({
        messages,
        max_tokens: opts.maxTokens || 500,
        temperature: opts.temperature != null ? opts.temperature : 0.4,
        top_p: 0.9,
      });
      const text = res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content;
      const out = String(text || "").trim();
      if (opts.onToken && out) opts.onToken(out, out);
      return out;
    }
    if (engine) {
      let out = "";
      const chunks = await engine.chat.completions.create({
        messages,
        stream: true,
        temperature: opts.temperature != null ? opts.temperature : 0.6,
        max_tokens: opts.maxTokens || 420,
      });
      for await (const chunk of chunks) {
        const delta = chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content || "";
        out += delta;
        if (opts.onToken) opts.onToken(delta, out);
      }
      return out;
    }
    if (hfPipe) {
      const out = await hfPipe(messages, {
        max_new_tokens: opts.maxTokens || 300,
        do_sample: true,
        temperature: opts.temperature != null ? opts.temperature : 0.6,
      });
      const text = Array.isArray(out) ? out[0].generated_text : out.generated_text;
      const last = Array.isArray(text) ? text[text.length - 1] : null;
      const str = last && last.content ? last.content : String(text);
      const cleaned = str.replace(/^[\s\S]*?<\|im_start\|>assistant\s*/i, "").split("<|im_end|>")[0].trim();
      const result = cleaned || str.trim();
      if (opts.onToken && result) opts.onToken(result, result);
      return result;
    }
    throw new Error("No model loaded — call SB.model.load() first");
  }

  function info() {
    return {
      kind: engineKind,
      name: "Bonk AI",
      model: { name: "Bonk AI", engine: engineKind },
      ready: !!(wllama || engine || hfPipe),
      webgpuAvailable: hasWebGPU(),
    };
  }

  window.SB.model = { hasWebGPU, load, generate, info };
})();
