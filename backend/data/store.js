const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function collectionPath(name) {
  ensureDataDir();
  return path.join(DATA_DIR, `${name}.json`);
}

function defaultFor(name) {
  if (name === "shows" || name === "watchlists") return [];
  return [];
}

async function readCollection(name) {
  const filePath = collectionPath(name);
  if (!fs.existsSync(filePath)) {
    const fallback = defaultFor(name);
    await fs.promises.writeFile(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  const raw = await fs.promises.readFile(filePath, "utf-8");
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

async function writeCollection(name, data) {
  const filePath = collectionPath(name);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { readCollection, writeCollection, makeId };
