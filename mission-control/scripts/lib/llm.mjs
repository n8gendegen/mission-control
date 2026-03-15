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
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (deepseekKey) {
    return {
      provider: "deepseek",
      apiKey: deepseekKey,
      endpoint: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions",
      model: model || process.env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      endpoint: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      model: model || process.env.AGENT_RUNNER_MODEL || "gpt-4.1-mini",
    };
  }
  throw new Error("Missing DEEPSEEK_API_KEY or OPENAI_API_KEY for LLM calls.");
}

export async function fetchJsonWithCache({ instructions, userContent, model, temperature = 0.2 }) {
  const config = getLLMConfig({ model });
  const cache = ensureCacheLoaded();
  const cacheKey = hashPromptKey({ provider: config.provider, model: config.model, instructions, userContent });
  const cached = cache[cacheKey];
  if (cached?.content) {
    return cached.content;
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
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
