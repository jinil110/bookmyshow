const { readJson, writeJson } = require("../utils/fileStore");

function cleanMovie(body, existing = {}) {
  const showtimes = Array.isArray(body.showtimes)
    ? body.showtimes
    : String(body.showtimes || "").split(",").map((item) => item.trim()).filter(Boolean);

  return {
    id: existing.id || `m_${Date.now()}`,
    title: String(body.title || existing.title || "").trim(),
    description: String(body.description || existing.description || "").trim(),
    duration: String(body.duration || existing.duration || "").trim(),
    rating: String(body.rating || existing.rating || "UA").trim(),
    category: String(body.category || existing.category || "Drama").trim(),
    price: Number(body.price || existing.price || 150),
    showtimes,
    poster: String(body.poster || existing.poster || "").trim(),
    banner: String(body.banner || existing.banner || body.poster || existing.poster || "").trim()
  };
}

async function listMovies(_req, res) {
  res.json(await readJson("movies.json"));
}

async function createMovie(req, res) {
  try {
    const movies = await readJson("movies.json");
    const movie = cleanMovie(req.body);
    if (!movie.title || !movie.description || !movie.poster) {
      return res.status(400).json({ message: "Title, description, and poster are required." });
    }
    movies.push(movie);
    await writeJson("movies.json", movies);
    res.status(201).json({ message: "Movie created.", movie });
  } catch (error) {
    res.status(500).json({ message: "Unable to create movie.", error: error.message });
  }
}

async function updateMovie(req, res) {
  try {
    const movies = await readJson("movies.json");
    const index = movies.findIndex((movie) => movie.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Movie not found." });
    movies[index] = cleanMovie(req.body, movies[index]);
    await writeJson("movies.json", movies);
    res.json({ message: "Movie updated.", movie: movies[index] });
  } catch (error) {
    res.status(500).json({ message: "Unable to update movie.", error: error.message });
  }
}

async function deleteMovie(req, res) {
  try {
    const movies = await readJson("movies.json");
    const nextMovies = movies.filter((movie) => movie.id !== req.params.id);
    if (nextMovies.length === movies.length) return res.status(404).json({ message: "Movie not found." });
    await writeJson("movies.json", nextMovies);
    res.json({ message: "Movie deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete movie.", error: error.message });
  }
}

module.exports = { listMovies, createMovie, updateMovie, deleteMovie };
