const { writeJson, readJson } = require("../utils/fileStore");

// Helper to fetch from open API (TVMaze) and map to our movie format
async function fetchMoviesFromAPI() {
  try {
    const res = await fetch("https://api.tvmaze.com/shows");
    if (!res.ok) throw new Error("Failed to fetch from open API");
    const shows = await res.json();
    
    // Map top 40 shows into our Movie format
    return shows.slice(0, 40).map(show => ({
      id: show.id.toString(),
      title: show.name,
      description: show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : "No description available.",
      category: show.genres && show.genres.length > 0 ? show.genres[0] : "Drama",
      duration: `${show.runtime || 120} min`,
      rating: show.rating?.average ? `${show.rating.average}/10` : "8/10",
      price: Math.floor(Math.random() * 200) + 200, // Random price between 200-400
      poster: show.image?.medium || "https://via.placeholder.com/210x295",
      banner: show.image?.original || "https://via.placeholder.com/1200x500",
      showtimes: [
        new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        new Date(Date.now() + 172800000).toISOString().slice(0, 16)
      ]
    }));
  } catch (error) {
    console.error("API error, falling back to local JSON:", error);
    return await readJson("movies.json");
  }
}

async function getMovies(req, res) {
  try {
    const movies = await fetchMoviesFromAPI();
    const query = String(req.query.search || "").toLowerCase();
    const category = String(req.query.category || "All");
    
    const filtered = movies.filter((movie) => {
      const matchesSearch = [movie.title, movie.description, movie.category]
        .join(" ")
        .toLowerCase()
        .includes(query);
      const matchesCategory = category === "All" || movie.category === category;
      return matchesSearch && matchesCategory;
    });
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: "Unable to load movies.", error: error.message });
  }
}

async function getMovie(req, res) {
  try {
    const movies = await fetchMoviesFromAPI();
    const movie = movies.find((item) => item.id === req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: "Unable to load movie.", error: error.message });
  }
}

module.exports = { getMovies, getMovie, fetchMoviesFromAPI };
