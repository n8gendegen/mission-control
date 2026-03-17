import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const CACHE_FILE = fileURLToPath(new URL("../../tmp/llm-cache.json", import.meta.url));
let cacheStore = null;

function ensureCacheLoaded() {
  if (cacheStore) {
    return cacheStore;
  }
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    cacheStore = JSON.parse(raw);
  } catch (_err) {
    cacheStore = {};
  }
  return cacheStore;
}

function persistCache() {
  const dir = path.dirname(CACHE_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheStore, null, 2));
}

function hashPromptKey({ provider, model, instructions, userContent }) {
  const hash = crypto.createHash("sha256");
  hash.update(provider ?? "");
  hash.update(model ?? "");
  hash.update(instructions ?? "");
  hash.update(userContent ?? "");
  return hash.digest("hex");
}

export function getLLMConfig({ model } = {}) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const resolvedModel = model || process.env.LLM_DEFAULT_MODEL || "minimax/minimax-quantum-8x7b";
  if (openrouterKey && (!model || resolvedModel.startsWith("openrouter") || resolvedModel.startsWith("minimax"))) {
    const normalizedModel = resolvedModel.replace(/^openrouter\//, "");
    return {
      provider: "openrouter",
      apiKey: openrouterKey,
      endpoint: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions",
      model: normalizedModel,
      headers: {
        "HTTP-Referer": process.env.OPENROUTER_REFERRER || "https://openclaw.ai",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Mission Control",
      },
    };
  }
  const qwenEndpoint = process.env.QWEN_API_URL || process.env.QWEN_LOCAL_URL;
  if (qwenEndpoint) {
    return {
      provider: "qwen",
      apiKey: process.env.QWEN_API_KEY || null,
      endpoint: qwenEndpoint,
      model: model || process.env.QWEN_MODEL || "qwen2.5-coder",
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      endpoint: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      model: model || process.env.AGENT_RUNNER_MODEL || "gpt-4.1-mini",
    };
  }
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (model?.startsWith("deepseek") && deepseekKey) {
    return {
      provider: "deepseek",
      apiKey: deepseekKey,
      endpoint: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions",
      model: model || process.env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }
  throw new Error("Missing OPENROUTER_API_KEY, QWEN_API_URL, or OPENAI_API_KEY for LLM calls.");
}

export async function fetchJsonWithCache({ instructions, userContent, model, temperature = 0.2 }) {
  const config = getLLMConfig({ model });
  const cache = ensureCacheLoaded();
  const cacheKey = hashPromptKey({ provider: config.provider, model: config.model, instructions, userContent });
  const cached = cache[cacheKey];
  if (cached?.content) {
    return cached.content;
  }

  const headers = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  if (config.headers) {
    Object.assign(headers, config.headers);
  }
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: userContent },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || "LLM request failed";
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM response missing content");
  }

  cache[cacheKey] = {
    provider: config.provider,
    model: config.model,
    cached_at: new Date().toISOString(),
    content,
  };
  persistCache();
  return content;
}
