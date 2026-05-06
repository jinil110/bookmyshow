const { readCollection, writeCollection, makeId } = require("../data/store");

const DEFAULT_SEATS = [
  "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
  "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8",
  "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8",
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8",
  "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8",
];

async function ensureShowsFromMovies() {
  let shows = await readCollection("shows");
  const now = new Date();
  
  // Check if we have shows for the upcoming 3 days
  const upcomingDay = new Date();
  upcomingDay.setDate(upcomingDay.getDate() + 3);
  const upcomingDayStr = upcomingDay.toISOString().split("T")[0];
  const hasUpcomingShows = shows.some(s => s.date === upcomingDayStr);

  if (shows.length > 0 && hasUpcomingShows) {
    return shows;
  }

  const movies = await readCollection("movies");
  const generatedShows = [];
  const cities = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad"];
  const theaterByCity = {
    Mumbai: "PVR: Phoenix Palladium",
    Delhi: "PVR: Select Citywalk",
    Bengaluru: "PVR: Orion Mall",
    Hyderabad: "AMB Cinemas",
    Ahmedabad: "PVR: Acropolis Mall",
  };

  const today = new Date();
  movies.forEach((movie) => {
    const movieId = movie._id || movie.id;
    
    // Ensure shows for the next 7 days
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      const dateStr = d.toISOString().split("T")[0];
      
      // If shows for this movie on this date already exist, skip
      if (shows.some(s => s.movie === movieId && s.date === dateStr)) {
        continue;
      }

      // Add 3 default times per day
      const times = ["10:30", "15:00", "20:00"];
      times.forEach((time, index) => {
        // Distribute shows evenly across cities
        cities.forEach((city) => {
          // Just a slight timezone adjustment for standard formatting
          const localTime = new Date(`${dateStr}T${time}:00`);
          generatedShows.push({
            _id: makeId("show"),
            movie: movieId,
            theaterName: theaterByCity[city] || "Main Screen",
            city,
            area: "",
            date: dateStr,
            time: localTime.toISOString(),
            price: Number(movie.price || 200),
            availableSeats: [...DEFAULT_SEATS],
            bookedSeats: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      });
    }
  });

  if (generatedShows.length > 0) {
    shows = shows.concat(generatedShows);
    await writeCollection("shows", shows);
  }
  return shows;
}

async function getMovies(req, res) {
  try {
    const movies = await readCollection("movies");
    const term = String(req.query.search || "").toLowerCase().trim();
    const filtered = movies
      .map((movie) => ({ ...movie, _id: movie._id || movie.id }))
      .filter((movie) => {
        if (term) {
          const haystack = `${movie.title || ""} ${movie.description || ""} ${movie.category || ""}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        if (req.query.category && req.query.category !== "All" && movie.category !== req.query.category) {
          return false;
        }
        if (req.query.isTrending === "true" && !movie.isTrending) return false;
        if (req.query.isLatest === "true" && !movie.isLatest) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: "Unable to load movies.", error: error.message });
  }
}

async function getMovie(req, res) {
  try {
    const movies = await readCollection("movies");
    const movie = movies
      .map((m) => ({ ...m, _id: m._id || m.id }))
      .find((m) => m._id === req.params.id || m.id === req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found." });

    const allShows = await ensureShowsFromMovies();
    const shows = allShows
      .filter((show) => show.movie === movie._id && (!req.query.city || show.city === req.query.city))
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    // Group shows by date to mimic BookMyShow
    const showtimes = {};
    shows.forEach((show) => {
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
    const shows = await ensureShowsFromMovies();
    const cities = [...new Set(shows.map((show) => show.city))];
    const cleaned = cities.filter(Boolean).sort((a, b) => a.localeCompare(b));
    res.json(cleaned);
  } catch (error) {
    res.status(500).json({ message: "Unable to load cities.", error: error.message });
  }
}

module.exports = { getMovies, getMovie, getCities };
