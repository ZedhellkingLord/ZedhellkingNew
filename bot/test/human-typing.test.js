const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  computeTypingDelay,
  createTypingSettings,
  createTypingController,
} = require("../human-typing");

const bounds = { minDelayMs: 600, maxDelayMs: 6000 };

test("short replies wait less than long replies", () => {
  const short = computeTypingDelay("ok", bounds, () => 0.5);
  const long = computeTypingDelay("x".repeat(120), bounds, () => 0.5);
  assert.ok(short < long);
});

test("delay is clamped to configured bounds", () => {
  assert.equal(computeTypingDelay("", bounds, () => 0.5), 600);
  assert.equal(computeTypingDelay("x".repeat(5000), bounds, () => 0.5), 6000);
});

test("jitter stays within 15 percent of the base delay", () => {
  const base = computeTypingDelay("x".repeat(40), bounds, () => 0.5);
  const low = computeTypingDelay("x".repeat(40), bounds, () => 0);
  const high = computeTypingDelay("x".repeat(40), bounds, () => 0.999);
  assert.ok(low >= base * 0.85 - 1 && low <= base);
  assert.ok(high <= base * 1.15 + 1 && high >= base);
});

test("settings persist the enabled flag and read env bounds", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "typing-"));
  const statePath = path.join(dir, "typing-state.json");
  const env = { TYPING_MIN_MS: "1000", TYPING_MAX_MS: "3000" };

  const settings = createTypingSettings({ statePath, env });
  assert.deepEqual(settings.get(), { enabled: true, minDelayMs: 1000, maxDelayMs: 3000 });

  settings.setEnabled(false);
  const reloaded = createTypingSettings({ statePath, env });
  assert.equal(reloaded.get().enabled, false);
});

test("each reply starts and stops its own typing indicator, even on error", async () => {
  const calls = [];
  const api = {
    async sendTypingIndicator(on, threadID) {
      calls.push(["typing", on, threadID]);
    },
    async sendMessage(message, threadID) {
      calls.push(["send", message, threadID]);
      if (message === "fail") throw new Error("boom");
      return { messageID: "m1" };
    },
  };
  const settings = { get: () => ({ enabled: true, minDelayMs: 0, maxDelayMs: 0 }) };
  const controller = createTypingController({ settings, sleep: async () => {}, log: { error() {} } });
  const typed = controller.wrap(api);

  assert.deepEqual(await typed.sendMessage("hi", "123"), { messageID: "m1" });
  await assert.rejects(typed.sendMessage("fail", "123"), /boom/);

  assert.deepEqual(calls, [
    ["typing", true, "123"],
    ["send", "hi", "123"],
    ["typing", false, "123"],
    ["typing", true, "123"],
    ["send", "fail", "123"],
    ["typing", false, "123"],
  ]);
});

test("concurrent replies to the same thread keep the indicator until the last one finishes", async () => {
  const calls = [];
  const api = {
    async sendTypingIndicator(on) {
      calls.push(on ? "on" : "off");
    },
    async sendMessage(message) {
      return message;
    },
  };
  const settings = { get: () => ({ enabled: true, minDelayMs: 0, maxDelayMs: 0 }) };
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const controller = createTypingController({ settings, sleep: () => gate, log: { error() {} } });
  const typed = controller.wrap(api);

  const first = typed.sendMessage("a", "t");
  const second = typed.sendMessage("b", "t");
  release();
  await Promise.all([first, second]);

  assert.deepEqual(calls, ["on", "off"]);
});

test("disabled typing sends immediately without indicator", async () => {
  const calls = [];
  const api = {
    async sendTypingIndicator() {
      calls.push("typing");
    },
    async sendMessage(message) {
      calls.push(message);
      return "ok";
    },
  };
  const settings = { get: () => ({ enabled: false, minDelayMs: 600, maxDelayMs: 6000 }) };
  const controller = createTypingController({ settings, log: { error() {} } });
  assert.equal(await controller.wrap(api).sendMessage("hi", "1"), "ok");
  assert.deepEqual(calls, ["hi"]);
});
