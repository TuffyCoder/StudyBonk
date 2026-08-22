/* StudyBonk shared local-model engine (Bonk AI core).
 * Loads quantized LLMs fully in the browser:
 *   - WebGPU path: vendored WebLLM (assets/vendor/webllm.js)
 *   - WASM fallback: vendored Transformers.js (assets/vendor/transformers.js.mjs)
 *     + onnx-community/Qwen2.5-0.5B-Instruct (public, ungated)
 * No API, no backend — model weights are the only network request (opt-in,
 * one-time, cached). Used by /ai/ and the /flashcards/ AI importer. */
(function () {
  "use strict";
  window.SB = window.SB || {};

  const WEBLLM_MODELS = [
    { key: "lite",  name: "Bonk Lite",  emoji: "🐤", id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", ram: "~600 MB RAM · 400 MB download", note: "Fits most laptops & phones" },
    { key: "core",  name: "Bonk Core",  emoji: "🧠", id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", ram: "~1.2 GB RAM · 900 MB download", note: "The daily driver", recommended: true },
    { key: "pro",   name: "Bonk Pro",   emoji: "🎓", id: "Phi-3.5-mini-instruct-q4f16_1-MLC", ram: "~2.6 GB RAM · 2.2 GB download", note: "Maximum brain (desktop)" },
    { key: "gemma", name: "Bonk Gemma", emoji: "💎", id: "gemma-2-2b-it-q4f16_1-MLC",       ram: "~1.7 GB RAM · 1.4 GB download", note: "Google's little gem" },
  ];

  // Public, ungated ONNX repo verified via the Hugging Face API.
  const WASM_MODEL = {
    key: "wasm", name: "Bonk WASM", emoji: "🐢",
    id: "onnx-community/Qwen2.5-0.5B-Instruct",
    dtype: "q8",
    ram: "~500 MB RAM · 510 MB download",
    note: "CPU fallback when WebGPU is unavailable",
  };

  let engine = null;      // webllm engine
  let hfPipe = null;      // transformers.js pipeline
  let engineKind = null;  // "webgpu" | "wasm"
  let loadedModel = null;
  let loading = null;     // in-flight load promise

  const hasWebGPU = () => !!navigator.gpu;

  const wasmPaths = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/";

  async function loadWebLLM(model, onProgress) {
    const webllm = await import("/assets/vendor/webllm.js");
    engine = await webllm.CreateMLCEngine(model.id, {
      initProgressCallback: (p) => onProgress && onProgress(p.progress || 0, p.text || "Downloading & compiling…"),
    });
    engineKind = "webgpu";
    loadedModel = model;
  }

  async function loadWasm(model, onProgress) {
    const tr = await import("/assets/vendor/transformers.js.mjs");
    tr.env.allowLocalModels = false;
    if (tr.env.backends && tr.env.backends.onnx && tr.env.backends.onnx.wasm) {
      tr.env.backends.onnx.wasm.wasmPaths = wasmPaths;
    }
    hfPipe = await tr.pipeline("text-generation", model.id, {
      dtype: model.dtype,
      progress_callback: (p) => {
        if (p && p.status === "progress" && p.total) {
          onProgress && onProgress(p.loaded / p.total, "Downloading model chunk " + (p.file || "") + "…");
        }
      },
    });
    engineKind = "wasm";
    loadedModel = model;
  }

  function load(kind, onProgress) {
    if (engine || hfPipe) return Promise.resolve(info());
    if (loading) return loading;
    const webgpu = hasWebGPU();
    const model = webgpu
      ? WEBLLM_MODELS.find((m) => m.key === (kind === "wasm" ? "lite" : kind)) || WEBLLM_MODELS[1]
      : WASM_MODEL;
    loading = (async () => {
      try {
        if (webgpu) await loadWebLLM(model, onProgress);
        else await loadWasm(model, onProgress);
      } catch (e) {
        engine = null; hfPipe = null; engineKind = null; loadedModel = null;
        throw e;
      } finally {
        loading = null;
      }
      return info();
    })();
    return loading;
  }

  async function generate(messages, opts) {
    opts = opts || {};
    if (engine && engineKind === "webgpu") {
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
    if (hfPipe && engineKind === "wasm") {
      const out = await hfPipe(messages, {
        max_new_tokens: opts.maxTokens || 300,
        do_sample: true,
        temperature: opts.temperature != null ? opts.temperature : 0.6,
      });
      const text = Array.isArray(out) ? out[0].generated_text : out.generated_text;
      const last = Array.isArray(text) ? text[text.length - 1] : null;
      const str = last && last.content ? last.content : String(text);
      // strip prompt echo if the model repeated the chat template
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
      model: loadedModel,
      ready: !!(engine || hfPipe),
      webgpuAvailable: hasWebGPU(),
    };
  }

  window.SB.model = { MODELS: WEBLLM_MODELS, WASM_MODEL, hasWebGPU, load, generate, info };
})();
