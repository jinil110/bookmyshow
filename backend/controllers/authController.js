const bcrypt = require("bcrypt");
const { readJson, writeJson } = require("../utils/fileStore");

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role || "user", createdAt: user.createdAt };
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const users = await readJson("users.json");
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((user) => user.email === normalizedEmail)) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const user = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: normalizedEmail === String(process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase() ? "admin" : "user",
      createdAt: new Date().toISOString()
    };
    users.push(user);
    await writeJson("users.json", users);
    req.session.user = publicUser(user);
    res.status(201).json({ message: "Registration successful.", user: req.session.user });
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const users = await readJson("users.json");
    const user = users.find((item) => item.email === String(email || "").trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    req.session.user = publicUser(user);
    res.json({ message: "Login successful.", user: req.session.user });
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully." });
  });
}

function me(req, res) {
  res.json({ user: req.session.user || null });
}

module.exports = { register, login, logout, me };
