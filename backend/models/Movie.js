const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    rating: { type: String, required: true },
    category: { type: String, required: true },
    poster: { type: String, required: true },
    banner: { type: String, required: true },
    isTrending: { type: Boolean, default: false },
    isLatest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
