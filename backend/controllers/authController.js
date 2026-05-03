const User = require("../models/User");

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role || "user", createdAt: user.createdAt };
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

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const role = normalizedEmail === String(process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase() ? "admin" : "user";
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role
    });

    req.session.user = publicUser(user);
    res.status(201).json({ message: "Registration successful.", user: req.session.user });
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password || ""))) {
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
