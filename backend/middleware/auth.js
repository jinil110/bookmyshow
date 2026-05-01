function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please login before booking tickets." });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please login first." });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
