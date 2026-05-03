const router = require("express").Router();
const { register, login, logout, me } = require("../controllers/authController");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", me);

module.exports = router;

