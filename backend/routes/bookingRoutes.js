const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { bookedSeats, createBooking, confirmPayment, createStripeSession, confirmStripePayment, getUserBookings } = require("../controllers/bookingController");

router.get("/movies/:movieId/seats", bookedSeats);
router.post("/book", requireAuth, createBooking);
router.post("/book/:id/pay", requireAuth, confirmPayment);
router.post("/book/:id/stripe-session", requireAuth, createStripeSession);
router.get("/book/:id/stripe-confirm", requireAuth, confirmStripePayment);
router.get("/user/bookings", requireAuth, getUserBookings);

module.exports = router;
