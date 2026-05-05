const { Resend } = require("resend");
const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");

async function sendBookingReceipt(user, booking, html) {
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
    await resend.emails.send({ from, to: user.email, subject, text, html });
    return { provider: "resend", sent: true };
  }

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({ from, to: user.email, subject, text, html });
    return { provider: "sendgrid", sent: true };
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `"CineGo Tickets" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject,
      text,
      html,
    });
    return { provider: "gmail", sent: true };
  }

  return { provider: "none", sent: false, reason: "No email API key configured." };
}

module.exports = { sendBookingReceipt };
