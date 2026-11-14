const fs = require("fs");
const path = require("path");

const BASE_DELAY_MS = 500;
const MS_PER_CHARACTER = 45;
const JITTER_RATIO = 0.15;
const DEFAULT_MIN_DELAY_MS = 600;
const DEFAULT_MAX_DELAY_MS = 6000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeTypingDelay(text, { minDelayMs, maxDelayMs }, random = Math.random) {
  const characters = [...text].length;
  const jitter = 1 + (random() * 2 - 1) * JITTER_RATIO;
  const raw = (BASE_DELAY_MS + characters * MS_PER_CHARACTER) * jitter;
  return Math.round(clamp(raw, minDelayMs, maxDelayMs));
}

function parseDelay(value, fallback) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}

function readStoredEnabled(statePath) {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return typeof state.enabled === "boolean" ? state.enabled : null;
  } catch (error) {
    return null;
  }
}

function createTypingSettings({ statePath, env = process.env }) {
  let minDelayMs = parseDelay(env.TYPING_MIN_MS, DEFAULT_MIN_DELAY_MS);
  let maxDelayMs = parseDelay(env.TYPING_MAX_MS, DEFAULT_MAX_DELAY_MS);
  if (minDelayMs > maxDelayMs) [minDelayMs, maxDelayMs] = [maxDelayMs, minDelayMs];

  const storedEnabled = readStoredEnabled(statePath);
  let enabled = storedEnabled !== null ? storedEnabled : env.TYPING_ENABLED !== "false";

  return {
    get() {
      return { enabled, minDelayMs, maxDelayMs };
    },
    setEnabled(value) {
      if (typeof value !== "boolean") throw new TypeError("typing enabled flag must be boolean");
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, JSON.stringify({ enabled: value }, null, 2));
      enabled = value;
    },
  };
}

function createTypingController({
  settings,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  log = console,
}) {
  const activeByThread = new Map();

  async function startTyping(api, threadID) {
    const count = activeByThread.get(threadID) || 0;
    activeByThread.set(threadID, count + 1);
    if (count > 0) return;
    try {
      await api.sendTypingIndicator(true, threadID);
    } catch (error) {
      log.error("[الكتابة] تعذر إظهار مؤشر الكتابة:", error.message || error);
    }
  }

  async function stopTyping(api, threadID) {
    const count = (activeByThread.get(threadID) || 1) - 1;
    if (count > 0) {
      activeByThread.set(threadID, count);
      return;
    }
    activeByThread.delete(threadID);
    try {
      await api.sendTypingIndicator(false, threadID);
    } catch (error) {
      log.error("[الكتابة] تعذر إخفاء مؤشر الكتابة:", error.message || error);
    }
  }

  function wrap(api) {
    const wrapped = Object.create(api);
    wrapped.sendMessage = async (message, threadID, ...rest) => {
      const config = settings.get();
      const hasCallback = rest.some((arg) => typeof arg === "function");
      if (!config.enabled || hasCallback) {
        return api.sendMessage(message, threadID, ...rest);
      }

      const key = String(threadID);
      const text = typeof message === "string" ? message : String((message && message.body) || "");
      const delay = computeTypingDelay(text, config);

      await startTyping(api, key);
      try {
        await sleep(delay);
        return await api.sendMessage(message, threadID, ...rest);
      } finally {
        await stopTyping(api, key);
      }
    };
    return wrapped;
  }

  return { wrap, settings };
}

module.exports = { computeTypingDelay, createTypingSettings, createTypingController };
