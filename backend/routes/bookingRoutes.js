const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { bookedSeats, createBooking, createRazorpayOrder, confirmRazorpayPayment, getUserBookings } = require("../controllers/bookingController");

router.get("/shows/:showId/seats", bookedSeats);
router.post("/book", requireAuth, createBooking);
router.post("/book/:id/razorpay-order", requireAuth, createRazorpayOrder);
router.post("/book/:id/razorpay-confirm", requireAuth, confirmRazorpayPayment);
router.get("/user/bookings", requireAuth, getUserBookings);

module.exports = router;
