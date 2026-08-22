# Bonk AI — Architecture 🤖

A tiny-but-smart study assistant that runs **fully client-side**: no API, no
backend, no cloud, no account. Two engines, one chat.

## Design goals & how they're met

| Requirement | Implementation |
|---|---|
| Load under 3 s | Instant Mode = 0 ms model load; cached models warm-start in ~1–2 s |
| Respond under 0.5 s | Instant Mode template engine answers in ~200 ms |
| Under ~600 MB RAM | Bonk Lite (Qwen 2.5 0.5B q4f16) ≈ 600 MB; SmolLM2-360M WASM ≈ 500 MB |
| Distilled + quantized | Q4-F16 MLC weights (WebGPU) / Q8 ONNX (WASM fallback) |
| WebGPU preferred, WASM fallback | WebLLM engine → Transformers.js pipeline (onnx-community/Qwen2.5-0.5B-Instruct, public + ungated) → Instant Mode |
| Offline after first load | Model weights cached by the browser (Cache API); app shell cached by `sw.js` |
| History in localStorage | AES-GCM encrypted via WebCrypto with a device-local key |
| Never send data anywhere | Only cross-origin request ever made: one-time, opt-in model-weight download (contains zero user data) |
| Hallucination guardrails | Low temperature, uncertainty-admitting system prompt, structured templates, "verify against your textbook" nudges |

## Instant Mode (default)

A ~10 KB intent engine — no download, works on any device, fully offline:

- **Intent detection**: flashcards / quiz / explain / meme / coach / arithmetic / identity-trust / greeting
- **Retrieval**: searches the built-in knowledge base (420+ flashcards of real educational content emitted into `study-data.js`) and cites the matching study guide — this is what makes a "template engine" feel smart
- **Flashcard generator**: matches built-in decks, builds active-recall starter decks for arbitrary topics, or creates cloze-deletion cards from pasted notes (saved as a real deck via `localStorage`)
- **Quiz builder**: resolves topic queries to explained question banks
- **Homework explainer**: 5-step structured breakdown (define → purpose → example → non-example → common trap)
- **Safe arithmetic**: sandboxed numeric evaluation, no eval of arbitrary code
- **Meme mode & coaching**: responsibly dosed brainrot + evidence-informed productivity frameworks
- **Memory**: remembers a preferred name (`call me X`) — nothing else

## Model Mode (opt-in, one click)

Vendored libraries (no third-party scripts at runtime):
- `assets/vendor/webllm.js` — MLC WebGPU runtime (Apache-2.0)
- `assets/vendor/transformers.js.mjs` — WASM fallback runtime (Apache-2.0)

Model registry:

| Model | Weights | RAM | Notes |
|---|---|---|---|
| Bonk Lite — Qwen2.5-0.5B-Instruct q4f16_1 | ~400 MB | ~600 MB | low-end friendly |
| Bonk Core — Qwen2.5-1.5B-Instruct q4f16_1 | ~900 MB | ~1.2 GB | recommended |
| Bonk Pro — Phi-3.5-mini-instruct q4f16_1 | ~2.2 GB | ~2.6 GB | desktop |
| Bonk Gemma — gemma-2-2b-it q4f16_1 | ~1.4 GB | ~1.7 GB | desktop |
| WASM fallback — onnx-community/Qwen2.5-0.5B-Instruct q8 (public repo, verified via HF API) | ~510 MB | ~500 MB | no-WebGPU devices |

System prompt (fixed, prepended to every conversation):

```
You are StudyBonk AI.
You are tiny but smart.
You explain things simply.
You generate flashcards.
You generate quizzes.
You help students learn fast.
You use memes when helpful.
You run fully local.
You use almost no RAM.
[+ guardrails: stay on study topics, admit uncertainty, never request
 personal data, teach methods over paste-ready homework answers]
```

Streaming: WebGPU path streams tokens via `engine.chat.completions.create({stream: true})`.

## Privacy flow

```
user input ──▶ browser (WebGPU/WASM inference) ──▶ screen
                │
                └─▶ localStorage (AES-GCM encrypted history, device key)
                          └─ "Clear memory" = gone, provably
```

Model download (opt-in only): `connect-src huggingface.co, cdn-lfs*.huggingface.co, cdn.jsdelivr.net` — static public weights, no user data included, cached for offline.
