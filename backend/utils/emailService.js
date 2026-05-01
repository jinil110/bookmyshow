const { Resend } = require("resend");
const sgMail = require("@sendgrid/mail");

async function sendBookingReceipt(user, booking) {
  const from = process.env.EMAIL_FROM || "CineGo <onboarding@resend.dev>";
  const subject = `CineGo receipt for ${booking.movieName}`;
  const text = [
    `Hi ${user.name},`,
    "",
    "Your booking is confirmed.",
    `Movie: ${booking.movieName}`,
    `Seats: ${booking.seats.join(", ")}`,
    `Show: ${new Date(booking.showTime).toLocaleString("en-IN")}`,
    `Amount: Rs ${booking.amount}`,
    `Payment status: ${booking.paymentStatus}`,
    "",
    "Thank you for booking with CineGo."
  ].join("\n");

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from, to: user.email, subject, text });
    return { provider: "resend", sent: true };
  }

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({ from, to: user.email, subject, text });
    return { provider: "sendgrid", sent: true };
  }

  return { provider: "none", sent: false, reason: "No email API key configured." };
}

module.exports = { sendBookingReceipt };
