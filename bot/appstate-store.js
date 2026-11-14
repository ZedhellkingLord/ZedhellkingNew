const fs = require("fs");
const path = require("path");

const REQUIRED_COOKIES = ["c_user", "xs"];

function hasSessionCookies(state) {
  if (!Array.isArray(state)) return false;
  const names = new Set(state.map((cookie) => cookie && cookie.key));
  return REQUIRED_COOKIES.every((name) => names.has(name));
}

function loadAppState(filePath) {
  if (!fs.existsSync(filePath)) return { state: null, problem: "missing" };

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { state: null, problem: "unreadable" };
  }

  if (!hasSessionCookies(parsed)) return { state: null, problem: "incomplete" };
  return { state: parsed, problem: null };
}

function saveAppState(filePath, state) {
  if (!hasSessionCookies(state)) {
    throw new Error("appstate does not contain a session");
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(state, null, 2), { mode: 0o600 });
    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    try {
      if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    } catch (cleanupError) {}
    throw error;
  }
}

module.exports = { hasSessionCookies, loadAppState, saveAppState };
