const Movie = require("../models/Movie");
const Show = require("../models/Show");

async function getMovies(req, res) {
  try {
    const query = req.query.search ? {
      $or: [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { category: { $regex: req.query.search, $options: "i" } },
      ]
    } : {};
    
    if (req.query.category && req.query.category !== "All") {
      query.category = req.query.category;
    }
    
    // Check if trending
    if (req.query.isTrending === 'true') {
        query.isTrending = true;
    }
    // Check if latest
    if (req.query.isLatest === 'true') {
        query.isLatest = true;
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: "Unable to load movies.", error: error.message });
  }
}

async function getMovie(req, res) {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    
    // Fetch shows for this movie
    const showQuery = { movie: movie._id };
    if (req.query.city) {
      showQuery.city = req.query.city;
    }
    const shows = await Show.find(showQuery).sort({ date: 1, time: 1 });
    
    // Group shows by date to mimic BookMyShow
    const showtimes = {};
    shows.forEach(show => {
        if (!showtimes[show.date]) {
            showtimes[show.date] = [];
        }
        showtimes[show.date].push(show);
    });

    res.json({ movie, showtimes });
  } catch (error) {
    res.status(500).json({ message: "Unable to load movie.", error: error.message });
  }
}

async function getCities(req, res) {
  try {
    const cities = await Show.distinct("city");
    const cleaned = cities.filter(Boolean).sort((a, b) => a.localeCompare(b));
    res.json(cleaned);
  } catch (error) {
    res.status(500).json({ message: "Unable to load cities.", error: error.message });
  }
}

module.exports = { getMovies, getMovie, getCities };
