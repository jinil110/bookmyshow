const path = require("path");
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const socialRoutes = require("./routes/socialRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bookmyshow-json-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
  })
);
app.use(flash());

app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api", authRoutes);
app.use("/api", movieRoutes);
app.use("/api", bookingRoutes);
app.use("/api", adminRoutes);
app.use("/api", socialRoutes);
app.use(authRoutes);
app.use(movieRoutes);
app.use(bookingRoutes);
app.use(adminRoutes);
app.use(socialRoutes);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, service: "cinego" });
});

app.use("/api/*", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, "..", "frontend", "404.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Movie booking app running at http://localhost:${PORT}`);
  });
}

module.exports = app;
