const router = require("express").Router();
const { requireAdmin } = require("../middleware/auth");
const { listMovies, createMovie, updateMovie, deleteMovie } = require("../controllers/adminController");

router.get("/admin/movies", requireAdmin, listMovies);
router.post("/admin/movies", requireAdmin, createMovie);
router.put("/admin/movies/:id", requireAdmin, updateMovie);
router.delete("/admin/movies/:id", requireAdmin, deleteMovie);

module.exports = router;
