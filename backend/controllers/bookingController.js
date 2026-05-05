const { readCollection, writeCollection, makeId } = require("../data/store");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendBookingReceipt } = require("../utils/emailService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_replace_me",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_replace_me",
});

async function bookedSeats(req, res) {
  try {
    const shows = await readCollection("shows");
    const show = shows.find((s) => s._id === req.params.showId);
    if (!show) return res.status(404).json({ message: "Show not found." });

    res.json({ seats: show.bookedSeats });
  } catch (error) {
    res.status(500).json({ message: "Unable to load booked seats.", error: error.message });
  }
}

async function createBooking(req, res) {
  try {
    const { showId, seats, timezone } = req.body;
    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Show and seats are required." });
    }

    const shows = await readCollection("shows");
    const show = shows.find((s) => s._id === showId);
    if (!show) return res.status(404).json({ message: "Show not found." });

    const alreadyTaken = seats.filter((seat) => show.bookedSeats.includes(seat));
    if (alreadyTaken.length) {
      return res.status(409).json({ message: `Seats already booked: ${alreadyTaken.join(", ")}` });
    }

    const amount = seats.length * show.price;

    const bookings = await readCollection("bookings");
    const booking = {
      _id: makeId("booking"),
      user: req.session.user.id,
      show: showId,
      seats,
      totalAmount: amount,
      status: "pending",
      userTimezone: timezone || "Asia/Kolkata",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    bookings.push(booking);
    await writeCollection("bookings", bookings);

    res.status(201).json({ message: "Booking created.", booking });
  } catch (error) {
    res.status(500).json({ message: "Unable to create booking.", error: error.message });
  }
}

async function createRazorpayOrder(req, res) {
  try {
    const bookings = await readCollection("bookings");
    const index = bookings.findIndex((b) => (b._id || b.id) === req.params.id);
    const booking = index >= 0 ? bookings[index] : null;
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "confirmed") return res.json({ paid: true, booking });

    // Mock Razorpay Order Creation if keys are placeholders
    if (process.env.RAZORPAY_KEY_ID === "rzp_test_replace_me" || !process.env.RAZORPAY_KEY_ID) {
        booking.orderId = `order_mock_${Date.now()}`;
        booking.updatedAt = new Date().toISOString();
        bookings[index] = booking;
        await writeCollection("bookings", bookings);
        return res.json({ 
            orderId: booking.orderId, 
            amount: booking.totalAmount * 100,
            currency: "INR",
            mock: true
        });
    }

    const options = {
      amount: booking.totalAmount * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: String(booking._id),
    };

    const order = await razorpay.orders.create(options);
    booking.orderId = order.id;
    booking.updatedAt = new Date().toISOString();
    bookings[index] = booking;
    await writeCollection("bookings", bookings);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Unable to create Razorpay order.", error: error.message });
  }
}

async function confirmRazorpayPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = req.body;
    
    const bookings = await readCollection("bookings");
    const bookingIndex = bookings.findIndex(
      (b) => (b._id || b.id) === req.params.id && (b.user === req.session.user.id || b.userId === req.session.user.id)
    );
    const booking = bookingIndex >= 0 ? bookings[bookingIndex] : null;
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    if (mock) {
        booking.status = "confirmed";
        booking.paymentId = `pay_mock_${Date.now()}`;
        booking.updatedAt = new Date().toISOString();
        bookings[bookingIndex] = booking;
        await writeCollection("bookings", bookings);

        // Update show seats
        const shows = await readCollection("shows");
        const showIndex = shows.findIndex((s) => s._id === booking.show);
        if (showIndex === -1) return res.status(404).json({ message: "Show not found." });
        const show = shows[showIndex];
        show.bookedSeats = [...new Set([...(show.bookedSeats || []), ...booking.seats])];
        show.updatedAt = new Date().toISOString();
        shows[showIndex] = show;
        await writeCollection("shows", shows);

        const movies = await readCollection("movies");
        const movie = movies.find((m) => (m._id || m.id) === show.movie);
        const showWithMovie = { ...show, movie };

        // Send Email
        await sendBookingEmail(req.session.user, booking, showWithMovie);
        
        return res.json({ message: "Mock Payment successful.", booking });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    booking.status = "confirmed";
    booking.paymentId = razorpay_payment_id;
    booking.updatedAt = new Date().toISOString();
    bookings[bookingIndex] = booking;
    await writeCollection("bookings", bookings);

    // Update show seats
    const shows = await readCollection("shows");
    const showIndex = shows.findIndex((s) => s._id === booking.show);
    if (showIndex === -1) return res.status(404).json({ message: "Show not found." });
    const show = shows[showIndex];
    show.bookedSeats = [...new Set([...(show.bookedSeats || []), ...booking.seats])];
    show.updatedAt = new Date().toISOString();
    shows[showIndex] = show;
    await writeCollection("shows", shows);

    const movies = await readCollection("movies");
    const movie = movies.find((m) => (m._id || m.id) === show.movie);
    const showWithMovie = { ...show, movie };

    // Send Email
    await sendBookingEmail(req.session.user, booking, showWithMovie);

    res.json({ message: "Payment successful.", booking });
  } catch (error) {
    res.status(500).json({ message: "Payment confirmation failed.", error: error.message });
  }
}

async function getUserBookings(req, res) {
  try {
    const bookings = await readCollection("bookings");
    const shows = await readCollection("shows");
    const movies = await readCollection("movies");
    const showMap = new Map(shows.map((s) => [s._id, s]));
    const movieMap = new Map(movies.map((m) => [m._id || m.id, { ...m, _id: m._id || m.id }]));

    const hydrated = bookings
      .filter((booking) => booking.user === req.session.user.id || booking.userId === req.session.user.id)
      .map((booking) => {
        const show = showMap.get(booking.show);
        const movie = show
          ? movieMap.get(show.movie)
          : booking.movieId
            ? movieMap.get(booking.movieId)
            : null;
        const fallbackShow = {
          _id: booking.show || null,
          theaterName: booking.theaterName || "Main Screen",
          time: booking.showTime || null,
          city: booking.city || "",
          area: booking.area || "",
          movie: movie || null,
        };
        return {
          ...booking,
          _id: booking._id || booking.id,
          show: show ? { ...show, movie } : fallbackShow,
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(hydrated);
  } catch (error) {
    res.status(500).json({ message: "Unable to load bookings.", error: error.message });
  }
}

async function sendBookingEmail(user, booking, show) {
  const movieTitle = show?.movie?.title || "Your Movie";
  const timezone = booking.userTimezone || "Asia/Kolkata";
  const showTime = new Date(show.time).toLocaleString("en-IN", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });
  const emailContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #f84464; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">🎬 CineGo Ticket</h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #333333; font-size: 20px;">Hi ${user.name}, your booking is confirmed! 🎉</h2>
        <p style="color: #666666; font-size: 15px; line-height: 1.6;">Get ready for an amazing cinematic experience. Here are your official ticket details:</p>
        
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px dashed #cccccc;">
          <h3 style="margin: 0 0 10px 0; color: #f84464; font-size: 18px;">${movieTitle}</h3>
          <p style="margin: 5px 0; color: #333333;"><strong>Theater:</strong> ${show.theaterName}</p>
          <p style="margin: 5px 0; color: #333333;"><strong>Location:</strong> ${show.theaterName}, ${show.area || ""} ${show.city || ""}</p>
          <p style="margin: 5px 0; color: #333333;"><strong>Date & Time:</strong> ${showTime} (${timezone})</p>
          <p style="margin: 5px 0; color: #333333;"><strong>Seats:</strong> ${booking.seats.join(", ")}</p>
          <p style="margin: 15px 0 0 0; color: #000000; font-size: 18px;"><strong>Total Paid:</strong> ₹${booking.totalAmount}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking._id}" alt="Ticket QR Code" style="border: 4px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px;">
          <p style="color: #888888; font-size: 12px; margin-top: 10px;">Scan at the entrance</p>
        </div>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; color: #888888; font-size: 12px; border-top: 1px solid #eaeaea;">
        © 2026 CineGo. Book Smarter, Watch Better.
      </div>
    </div>
  `;

  try {
    const receipt = {
      movieName: movieTitle,
      seats: booking.seats,
      showTime: show.time,
      amount: booking.totalAmount,
      paymentStatus: booking.status,
    };
    const result = await sendBookingReceipt(user, receipt, emailContent);
    if (!result.sent) {
      console.log("--- MOCK EMAIL DELIVERED (NO PROVIDER CONFIGURED) ---");
      console.log(`To: ${user.email}`);
      console.log(`Subject: CineGo receipt for ${movieTitle}`);
      console.log("----------------------------");
      return;
    }
    console.log(
      `Ticket email sent successfully to ${user.email} via ${result.provider}.`
    );
  } catch (err) {
    console.error("Failed to send ticket email:", err.message);
  }
}

module.exports = { bookedSeats, createBooking, createRazorpayOrder, confirmRazorpayPayment, getUserBookings };
