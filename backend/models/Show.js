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
    city: {
      type: String,
      required: true,
      default: "Mumbai",
      index: true,
    },
    area: {
      type: String,
      default: "",
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
        "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8",
        "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8",
        "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8",
        "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"
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
