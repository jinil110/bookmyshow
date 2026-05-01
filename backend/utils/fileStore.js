const fs = require("fs").promises;
const path = require("path");

const dataPath = path.join(__dirname, "..", "..", "data");

async function readJson(fileName) {
  const filePath = path.join(dataPath, fileName);
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeJson(fileName, []);
      return [];
    }
    throw error;
  }
}

async function writeJson(fileName, data) {
  const filePath = path.join(dataPath, fileName);
  await fs.mkdir(dataPath, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = { readJson, writeJson };
