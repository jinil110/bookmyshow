const { readJson, writeJson } = require("../utils/fileStore");
const { sendBookingReceipt } = require("../utils/emailService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_not_configured");
const { fetchMoviesFromAPI } = require("./movieController");

async function bookedSeats(req, res) {
  try {
    const bookings = await readJson("bookings.json");
    const seats = bookings
      .filter((booking) => booking.movieId === req.params.movieId && booking.paymentStatus === "Paid")
      .flatMap((booking) => booking.seats);
    res.json({ seats });
  } catch (error) {
    res.status(500).json({ message: "Unable to load booked seats.", error: error.message });
  }
}

async function createBooking(req, res) {
  try {
    const { movieId, seats, showTime } = req.body;
    if (!movieId || !Array.isArray(seats) || seats.length === 0 || !showTime) {
      return res.status(400).json({ message: "Movie, seats, and show time are required." });
    }

    const movies = await fetchMoviesFromAPI();
    const movie = movies.find((item) => item.id === movieId);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    if (Array.isArray(movie.showtimes) && movie.showtimes.length && !movie.showtimes.includes(showTime)) {
      return res.status(400).json({ message: "Please select a valid showtime." });
    }

    const bookings = await readJson("bookings.json");
    const reservedSeats = bookings
      .filter((booking) => booking.movieId === movieId && booking.paymentStatus === "Paid")
      .flatMap((booking) => booking.seats);
    const alreadyTaken = seats.filter((seat) => reservedSeats.includes(seat));
    if (alreadyTaken.length) {
      return res.status(409).json({ message: `Seats already booked: ${alreadyTaken.join(", ")}` });
    }

    const booking = {
      id: `booking_${Date.now()}`,
      userId: req.session.user.id,
      userName: req.session.user.name,
      movieId,
      movieName: movie.title,
      seats,
      showTime,
      amount: seats.length * movie.price,
      paymentStatus: "Pending",
      createdAt: new Date().toISOString()
    };
    bookings.push(booking);
    await writeJson("bookings.json", bookings);
    res.status(201).json({ message: "Booking created.", booking });
  } catch (error) {
    res.status(500).json({ message: "Unable to create booking.", error: error.message });
  }
}

async function confirmPayment(req, res) {
  try {
    const bookings = await readJson("bookings.json");
    const booking = bookings.find((item) => item.id === req.params.id && item.userId === req.session.user.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.paymentStatus !== "Paid") {
      booking.paymentStatus = "Paid";
      booking.paidAt = new Date().toISOString();
      booking.paymentProvider = "Demo";
    }
    await writeJson("bookings.json", bookings);
    const receipt = await sendReceiptSafe(req.session.user, booking);
    res.json({ message: "Payment successful.", booking, receipt });
  } catch (error) {
    res.status(500).json({ message: "Payment failed.", error: error.message });
  }
}

async function createStripeSession(req, res) {
  try {
    const bookings = await readJson("bookings.json");
    const booking = bookings.find((item) => item.id === req.params.id && item.userId === req.session.user.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.paymentStatus === "Paid") return res.json({ paid: true, booking });

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
      // Mock payment flow for fully working demo
      booking.paymentProvider = "Demo";
      await writeJson("bookings.json", bookings);
      // Return a dummy url to just complete the payment immediately to avoid broken app
      return res.json({ url: `${appUrl}/confirmation.html?booking=${booking.id}&session_id=mock_session_${Date.now()}`, sessionId: `mock_session_${Date.now()}` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: booking.id,
      customer_email: req.session.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: booking.amount * 100,
            product_data: {
              name: `${booking.movieName} - ${booking.seats.join(", ")}`,
              description: `Showtime: ${new Date(booking.showTime).toLocaleString("en-IN")}`
            }
          }
        }
      ],
      metadata: { bookingId: booking.id, userId: req.session.user.id },
      success_url: `${appUrl}/confirmation.html?booking=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment.html?id=${booking.id}&cancelled=1`
    });

    booking.stripeSessionId = session.id;
    booking.paymentProvider = "Stripe";
    await writeJson("bookings.json", bookings);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: "Unable to start Stripe checkout.", error: error.message });
  }
}

async function confirmStripePayment(req, res) {
  try {
    const { session_id: sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ message: "Stripe session id is required." });

    if (sessionId.startsWith("mock_session_")) {
      // Mock payment confirmed
      const bookings = await readJson("bookings.json");
      const booking = bookings.find((item) => item.id === req.params.id && item.userId === req.session.user.id);
      if (!booking) return res.status(404).json({ message: "Booking not found." });

      booking.paymentStatus = "Paid";
      booking.paymentProvider = "Demo";
      booking.stripeSessionId = sessionId;
      booking.paidAt = new Date().toISOString();
      await writeJson("bookings.json", bookings);
      const receipt = await sendReceiptSafe(req.session.user, booking);
      return res.json({ message: "Mock payment confirmed.", booking, receipt });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
      return res.status(400).json({ message: "Stripe is not configured." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Stripe payment is not complete yet." });
    }

    const bookings = await readJson("bookings.json");
    const booking = bookings.find((item) => item.id === req.params.id && item.userId === req.session.user.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      return res.status(409).json({ message: "Stripe session does not match this booking." });
    }

    booking.paymentStatus = "Paid";
    booking.paymentProvider = "Stripe";
    booking.stripeSessionId = sessionId;
    booking.paidAt = new Date().toISOString();
    await writeJson("bookings.json", bookings);
    const receipt = await sendReceiptSafe(req.session.user, booking);
    res.json({ message: "Stripe payment confirmed.", booking, receipt });
  } catch (error) {
    res.status(500).json({ message: "Unable to confirm Stripe payment.", error: error.message });
  }
}

async function getUserBookings(req, res) {
  try {
    const bookings = await readJson("bookings.json");
    res.json(bookings.filter((booking) => booking.userId === req.session.user.id).reverse());
  } catch (error) {
    res.status(500).json({ message: "Unable to load bookings.", error: error.message });
  }
}

async function sendReceiptSafe(user, booking) {
  try {
    return await sendBookingReceipt(user, booking);
  } catch (error) {
    return { sent: false, error: error.message };
  }
}

module.exports = { bookedSeats, createBooking, confirmPayment, createStripeSession, confirmStripePayment, getUserBookings };
