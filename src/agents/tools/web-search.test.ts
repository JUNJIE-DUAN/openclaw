import { afterEach, describe, expect, it } from "vitest";

import { __testing } from "./web-search.js";

const {
  inferPerplexityBaseUrlFromApiKey,
  resolvePerplexityBaseUrl,
  normalizeFreshness,
  resolveSerpApiEngine,
  resolveSerpApiApiKey,
} = __testing;

describe("web_search perplexity baseUrl defaults", () => {
  it("detects a Perplexity key prefix", () => {
    expect(inferPerplexityBaseUrlFromApiKey("pplx-123")).toBe("direct");
  });

  it("detects an OpenRouter key prefix", () => {
    expect(inferPerplexityBaseUrlFromApiKey("sk-or-v1-123")).toBe("openrouter");
  });

  it("returns undefined for unknown key formats", () => {
    expect(inferPerplexityBaseUrlFromApiKey("unknown-key")).toBeUndefined();
  });

  it("prefers explicit baseUrl over key-based defaults", () => {
    expect(resolvePerplexityBaseUrl({ baseUrl: "https://example.com" }, "config", "pplx-123")).toBe(
      "https://example.com",
    );
  });

  it("defaults to direct when using PERPLEXITY_API_KEY", () => {
    expect(resolvePerplexityBaseUrl(undefined, "perplexity_env")).toBe("https://api.perplexity.ai");
  });

  it("defaults to OpenRouter when using OPENROUTER_API_KEY", () => {
    expect(resolvePerplexityBaseUrl(undefined, "openrouter_env")).toBe(
      "https://openrouter.ai/api/v1",
    );
  });

  it("defaults to direct when config key looks like Perplexity", () => {
    expect(resolvePerplexityBaseUrl(undefined, "config", "pplx-123")).toBe(
      "https://api.perplexity.ai",
    );
  });

  it("defaults to OpenRouter when config key looks like OpenRouter", () => {
    expect(resolvePerplexityBaseUrl(undefined, "config", "sk-or-v1-123")).toBe(
      "https://openrouter.ai/api/v1",
    );
  });

  it("defaults to OpenRouter for unknown config key formats", () => {
    expect(resolvePerplexityBaseUrl(undefined, "config", "weird-key")).toBe(
      "https://openrouter.ai/api/v1",
    );
  });
});

describe("web_search serpapi engine resolution", () => {
  it("defaults to google when no config is provided", () => {
    expect(resolveSerpApiEngine(undefined)).toBe("google");
    expect(resolveSerpApiEngine({})).toBe("google");
  });

  it("uses engine from config when provided", () => {
    expect(resolveSerpApiEngine({ engine: "bing" })).toBe("bing");
    expect(resolveSerpApiEngine({ engine: "  yahoo  " })).toBe("yahoo");
  });

  it("falls back to google for empty string engine", () => {
    expect(resolveSerpApiEngine({ engine: "" })).toBe("google");
    expect(resolveSerpApiEngine({ engine: "  " })).toBe("google");
  });
});

describe("web_search serpapi API key resolution", () => {
  const originalEnv = process.env.SERPAPI_API_KEY;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SERPAPI_API_KEY;
    } else {
      process.env.SERPAPI_API_KEY = originalEnv;
    }
  });

  it("prefers config apiKey over env", () => {
    process.env.SERPAPI_API_KEY = "env-key";
    expect(resolveSerpApiApiKey({ apiKey: "config-key" })).toBe("config-key");
  });

  it("falls back to SERPAPI_API_KEY env var", () => {
    process.env.SERPAPI_API_KEY = "env-key";
    expect(resolveSerpApiApiKey({})).toBe("env-key");
    expect(resolveSerpApiApiKey(undefined)).toBe("env-key");
  });

  it("returns undefined when no key is available", () => {
    delete process.env.SERPAPI_API_KEY;
    expect(resolveSerpApiApiKey(undefined)).toBeUndefined();
    expect(resolveSerpApiApiKey({})).toBeUndefined();
  });
});

describe("web_search freshness normalization", () => {
  it("accepts Brave shortcut values", () => {
    expect(normalizeFreshness("pd")).toBe("pd");
    expect(normalizeFreshness("PW")).toBe("pw");
  });

  it("accepts valid date ranges", () => {
    expect(normalizeFreshness("2024-01-01to2024-01-31")).toBe("2024-01-01to2024-01-31");
  });

  it("rejects invalid date ranges", () => {
    expect(normalizeFreshness("2024-13-01to2024-01-31")).toBeUndefined();
    expect(normalizeFreshness("2024-02-30to2024-03-01")).toBeUndefined();
    expect(normalizeFreshness("2024-03-10to2024-03-01")).toBeUndefined();
  });
});
