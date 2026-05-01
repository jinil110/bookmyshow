const router = require("express").Router();
const { getMovies, getMovie } = require("../controllers/movieController");

router.get("/movies", getMovies);
router.get("/movies/:id", getMovie);

module.exports = router;
