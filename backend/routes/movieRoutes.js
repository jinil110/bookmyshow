const router = require("express").Router();
const { getMovies, getMovie, getCities } = require("../controllers/movieController");

router.get("/movies", getMovies);
router.get("/movies/:id", getMovie);
router.get("/cities", getCities);

module.exports = router;
