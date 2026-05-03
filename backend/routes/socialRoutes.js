const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { getReviews, addReview, getWatchlist, toggleWatchlist } = require("../controllers/socialController");

router.get("/movies/:movieId/reviews", getReviews);
router.post("/movies/:movieId/reviews", requireAuth, addReview);
router.get("/user/watchlist", requireAuth, getWatchlist);
router.post("/movies/:movieId/watchlist", requireAuth, toggleWatchlist);


module.exports = router;
