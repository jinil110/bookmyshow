const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    theaterName: {
      type: String,
      default: "Main Screen",
    },
    date: {
      type: String, // e.g., "2026-05-01"
      required: true,
    },
    time: {
      type: String, // e.g., "18:30" (in local time or we store ISO UTC and parse frontend) Let's store UTC ISO string here.
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    availableSeats: {
      type: [String],
      default: [
        "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
        "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8",
        "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"
      ],
    },
    bookedSeats: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Show = mongoose.model("Show", showSchema);

module.exports = Show;
