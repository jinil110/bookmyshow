const { readCollection, writeCollection, makeId } = require("../data/store");

async function listMovies(_req, res) {
  try {
    const movies = await readCollection("movies");
    const response = movies
      .map((movie) => ({ ...movie, _id: movie._id || movie.id }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Unable to list movies.", error: error.message });
  }
}

async function createMovie(req, res) {
  try {
    const movies = await readCollection("movies");
    const movie = {
      _id: makeId("movie"),
      title: req.body.title,
      description: req.body.description,
      duration: req.body.duration,
      rating: req.body.rating,
      category: req.body.category,
      poster: req.body.poster,
      banner: req.body.banner,
      isTrending: Boolean(req.body.isTrending),
      isLatest: Boolean(req.body.isLatest),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    movies.push(movie);
    await writeCollection("movies", movies);
    res.status(201).json({ message: "Movie created.", movie });
  } catch (error) {
    res.status(500).json({ message: "Unable to create movie.", error: error.message });
  }
}

async function updateMovie(req, res) {
  try {
    const movies = await readCollection("movies");
    const index = movies.findIndex((m) => (m._id || m.id) === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Movie not found." });
    const movie = {
      ...movies[index],
      ...req.body,
      _id: movies[index]._id || movies[index].id || req.params.id,
      updatedAt: new Date().toISOString(),
    };
    movies[index] = movie;
    await writeCollection("movies", movies);
    res.json({ message: "Movie updated.", movie });
  } catch (error) {
    res.status(500).json({ message: "Unable to update movie.", error: error.message });
  }
}

async function deleteMovie(req, res) {
  try {
    const movies = await readCollection("movies");
    const next = movies.filter((m) => (m._id || m.id) !== req.params.id);
    if (next.length === movies.length) return res.status(404).json({ message: "Movie not found." });
    await writeCollection("movies", next);
    res.json({ message: "Movie deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete movie.", error: error.message });
  }
}

module.exports = { listMovies, createMovie, updateMovie, deleteMovie };
