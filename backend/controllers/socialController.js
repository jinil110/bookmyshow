const { readJson, writeJson } = require("../utils/fileStore");
const { fetchMoviesFromAPI } = require("./movieController");

async function getReviews(req, res) {
  const reviews = await readJson("reviews.json");
  res.json(reviews.filter((review) => review.movieId === req.params.movieId).reverse());
}

async function addReview(req, res) {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();
    if (!rating || rating < 1 || rating > 5 || comment.length < 3) {
      return res.status(400).json({ message: "Rating 1-5 and a short comment are required." });
    }
    const movies = await fetchMoviesFromAPI();
    if (!movies.some((movie) => movie.id === req.params.movieId)) {
      return res.status(404).json({ message: "Movie not found." });
    }
    const reviews = await readJson("reviews.json");
    const review = {
      id: `review_${Date.now()}`,
      movieId: req.params.movieId,
      userId: req.session.user.id,
      userName: req.session.user.name,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };
    reviews.push(review);
    await writeJson("reviews.json", reviews);
    res.status(201).json({ message: "Review added.", review });
  } catch (error) {
    res.status(500).json({ message: "Unable to add review.", error: error.message });
  }
}

async function getWatchlist(req, res) {
  const watchlists = await readJson("watchlists.json");
  const movies = await fetchMoviesFromAPI();
  const ids = watchlists.filter((item) => item.userId === req.session.user.id).map((item) => item.movieId);
  res.json(movies.filter((movie) => ids.includes(movie.id)));
}

async function toggleWatchlist(req, res) {
  try {
    const movies = await fetchMoviesFromAPI();
    if (!movies.some((movie) => movie.id === req.params.movieId)) {
      return res.status(404).json({ message: "Movie not found." });
    }
    const watchlists = await readJson("watchlists.json");
    const existing = watchlists.findIndex((item) => item.userId === req.session.user.id && item.movieId === req.params.movieId);
    if (existing >= 0) {
      watchlists.splice(existing, 1);
      await writeJson("watchlists.json", watchlists);
      return res.json({ message: "Removed from watchlist.", inWatchlist: false });
    }
    watchlists.push({ userId: req.session.user.id, movieId: req.params.movieId, createdAt: new Date().toISOString() });
    await writeJson("watchlists.json", watchlists);
    res.json({ message: "Added to watchlist.", inWatchlist: true });
  } catch (error) {
    res.status(500).json({ message: "Unable to update watchlist.", error: error.message });
  }
}

module.exports = { getReviews, addReview, getWatchlist, toggleWatchlist };
