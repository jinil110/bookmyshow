const Movie = require("../models/Movie");

async function listMovies(_req, res) {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: "Unable to list movies.", error: error.message });
  }
}

async function createMovie(req, res) {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({ message: "Movie created.", movie });
  } catch (error) {
    res.status(500).json({ message: "Unable to create movie.", error: error.message });
  }
}

async function updateMovie(req, res) {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    res.json({ message: "Movie updated.", movie });
  } catch (error) {
    res.status(500).json({ message: "Unable to update movie.", error: error.message });
  }
}

async function deleteMovie(req, res) {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    res.json({ message: "Movie deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete movie.", error: error.message });
  }
}

module.exports = { listMovies, createMovie, updateMovie, deleteMovie };
