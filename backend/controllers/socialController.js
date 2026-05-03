const Review = require("../models/Review");
const Watchlist = require("../models/Watchlist");
const Movie = require("../models/Movie");

async function getReviews(req, res) {
  try {
    const reviews = await Review.find({ movie: req.params.movieId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Unable to load reviews.", error: error.message });
  }
}

async function addReview(req, res) {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();
    if (!rating || rating < 1 || rating > 5 || comment.length < 3) {
      return res.status(400).json({ message: "Rating 1-5 and a short comment are required." });
    }
    
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    const review = await Review.create({
      movie: req.params.movieId,
      user: req.session.user.id,
      userName: req.session.user.name,
      rating,
      comment,
    });
    
    res.status(201).json({ message: "Review added.", review });
  } catch (error) {
    res.status(500).json({ message: "Unable to add review.", error: error.message });
  }
}

async function getWatchlist(req, res) {
  try {
    const watchlists = await Watchlist.find({ user: req.session.user.id }).populate('movie');
    const movies = watchlists.map(w => w.movie).filter(Boolean);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: "Unable to load watchlist.", error: error.message });
  }
}

async function toggleWatchlist(req, res) {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    const existing = await Watchlist.findOne({ user: req.session.user.id, movie: req.params.movieId });
    if (existing) {
      await Watchlist.findByIdAndDelete(existing._id);
      return res.json({ message: "Removed from watchlist.", inWatchlist: false });
    }

    await Watchlist.create({ user: req.session.user.id, movie: req.params.movieId });
    res.json({ message: "Added to watchlist.", inWatchlist: true });
  } catch (error) {
    res.status(500).json({ message: "Unable to update watchlist.", error: error.message });
  }
}

module.exports = { getReviews, addReview, getWatchlist, toggleWatchlist };
