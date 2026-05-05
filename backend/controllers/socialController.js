const { readCollection, writeCollection, makeId } = require("../data/store");

async function getReviews(req, res) {
  try {
    const reviews = await readCollection("reviews");
    const list = reviews
      .filter((review) => review.movie === req.params.movieId || review.movieId === req.params.movieId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(list);
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
    
    const movies = await readCollection("movies");
    const movie = movies.find((m) => (m._id || m.id) === req.params.movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    const reviews = await readCollection("reviews");
    const review = {
      _id: makeId("review"),
      movie: req.params.movieId,
      user: req.session.user.id,
      userName: req.session.user.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviews.push(review);
    await writeCollection("reviews", reviews);

    res.status(201).json({ message: "Review added.", review });
  } catch (error) {
    res.status(500).json({ message: "Unable to add review.", error: error.message });
  }
}

async function getWatchlist(req, res) {
  try {
    const watchlists = await readCollection("watchlists");
    const movies = await readCollection("movies");
    const movieMap = new Map(movies.map((movie) => [movie._id || movie.id, { ...movie, _id: movie._id || movie.id }]));
    const userWatchlist = watchlists.filter((item) => item.user === req.session.user.id || item.userId === req.session.user.id);
    const selected = userWatchlist.map((item) => movieMap.get(item.movie || item.movieId)).filter(Boolean);
    res.json(selected);
  } catch (error) {
    res.status(500).json({ message: "Unable to load watchlist.", error: error.message });
  }
}

async function toggleWatchlist(req, res) {
  try {
    const movies = await readCollection("movies");
    const movie = movies.find((m) => (m._id || m.id) === req.params.movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    const watchlists = await readCollection("watchlists");
    const existing = watchlists.find(
      (item) =>
        (item.user === req.session.user.id || item.userId === req.session.user.id) &&
        (item.movie === req.params.movieId || item.movieId === req.params.movieId)
    );
    if (existing) {
      const remaining = watchlists.filter((item) => item._id !== existing._id);
      await writeCollection("watchlists", remaining);
      return res.json({ message: "Removed from watchlist.", inWatchlist: false });
    }

    watchlists.push({
      _id: makeId("watchlist"),
      user: req.session.user.id,
      movie: req.params.movieId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await writeCollection("watchlists", watchlists);
    res.json({ message: "Added to watchlist.", inWatchlist: true });
  } catch (error) {
    res.status(500).json({ message: "Unable to update watchlist.", error: error.message });
  }
}

module.exports = { getReviews, addReview, getWatchlist, toggleWatchlist };
