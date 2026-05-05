const Booking = require("../models/Booking");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendBookingReceipt } = require("../utils/emailService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_replace_me",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_replace_me",
});

async function bookedSeats(req, res) {
  try {
    const show = await Show.findById(req.params.showId);
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

    const show = await Show.findById(showId).populate("movie");
    if (!show) return res.status(404).json({ message: "Show not found." });

    const alreadyTaken = seats.filter((seat) => show.bookedSeats.includes(seat));
    if (alreadyTaken.length) {
      return res.status(409).json({ message: `Seats already booked: ${alreadyTaken.join(", ")}` });
    }

    const amount = seats.length * show.price;

    const booking = await Booking.create({
      user: req.session.user.id,
      show: showId,
      seats,
      totalAmount: amount,
      status: "pending",
      userTimezone: timezone || "Asia/Kolkata",
    });

    res.status(201).json({ message: "Booking created.", booking });
  } catch (error) {
    res.status(500).json({ message: "Unable to create booking.", error: error.message });
  }
}

async function createRazorpayOrder(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "confirmed") return res.json({ paid: true, booking });

    // Mock Razorpay Order Creation if keys are placeholders
    if (process.env.RAZORPAY_KEY_ID === "rzp_test_replace_me" || !process.env.RAZORPAY_KEY_ID) {
        booking.orderId = `order_mock_${Date.now()}`;
        await booking.save();
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
      receipt: booking._id.toString(),
    };

    const order = await razorpay.orders.create(options);
    booking.orderId = order.id;
    await booking.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Unable to create Razorpay order.", error: error.message });
  }
}

async function confirmRazorpayPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = req.body;
    
    const booking = await Booking.findOne({ _id: req.params.id, user: req.session.user.id }).populate('show');
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    if (mock) {
        booking.status = "confirmed";
        booking.paymentId = `pay_mock_${Date.now()}`;
        await booking.save();
        
        // Update show seats
        const show = await Show.findById(booking.show._id).populate('movie');
        show.bookedSeats.push(...booking.seats);
        await show.save();

        // Send Email
        await sendBookingEmail(req.session.user, booking, show);
        
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
    await booking.save();

    // Update show seats
    const show = await Show.findById(booking.show._id).populate('movie');
    show.bookedSeats.push(...booking.seats);
    await show.save();

    // Send Email
    await sendBookingEmail(req.session.user, booking, show);

    res.json({ message: "Payment successful.", booking });
  } catch (error) {
    res.status(500).json({ message: "Payment confirmation failed.", error: error.message });
  }
}

async function getUserBookings(req, res) {
  try {
    const bookings = await Booking.find({ user: req.session.user.id })
      .populate({
          path: "show",
          populate: {
              path: "movie"
          }
      })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Unable to load bookings.", error: error.message });
  }
}

async function sendBookingEmail(user, booking, show) {
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
          <h3 style="margin: 0 0 10px 0; color: #f84464; font-size: 18px;">${show.movie.title}</h3>
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
      movieName: show.movie.title,
      seats: booking.seats,
      showTime: show.time,
      amount: booking.totalAmount,
      paymentStatus: booking.status,
    };
    const result = await sendBookingReceipt(user, receipt, emailContent);
    if (!result.sent) {
      console.log("--- MOCK EMAIL DELIVERED (NO PROVIDER CONFIGURED) ---");
      console.log(`To: ${user.email}`);
      console.log(`Subject: CineGo receipt for ${show.movie.title}`);
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
