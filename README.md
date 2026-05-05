# CineGo - BookMyShow-like Web App
**This is a demo project. Payments can run in mock mode if keys are not configured.**

A complete movie ticket booking application built with HTML5, CSS3, vanilla JavaScript, Node.js, Express.js, JSON file persistence, bcrypt, and express-session.

## Features

- User registration, login, logout, and session authentication
- Password hashing with bcrypt
- JSON file persistence (`data/*.json`) with no external database dependency
- Movie search and category filtering
- Movie details, booking flow, seat selection, fake payment, and confirmation pages
- User profile with previous booking history
- Email receipts using Resend/SendGrid/Gmail when keys are configured
- Admin panel for movie and showtime CRUD
- Per-movie reviews and user watchlist
- City-based theater selection with auto-detect location option
- Real timezone-aware showtime and booking confirmations
- Frontend and backend validation
- Toast notifications, loader, hover effects, active navbar states, responsive design
- 404 error page

## Run

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Optional Environment Setup

Copy `.env.example` to `.env` and fill the keys you want to use.

```bash
copy .env.example .env
```

Admin access:

- Set `ADMIN_EMAIL=your@email.com`
- Register using that same email
- The navbar will show the Admin page

Required:

- `SESSION_SECRET`

Payments (Razorpay):

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- If keys are not set, mock mode is used for test flow.

Email receipts (choose one provider):

- Resend: `RESEND_API_KEY` + `EMAIL_FROM`
- SendGrid: `SENDGRID_API_KEY` + verified sender in `EMAIL_FROM`
- Gmail fallback: `GMAIL_USER` + `GMAIL_APP_PASSWORD`

Health route:

- `GET /healthz`

## Main API Routes

- `POST /register` or `POST /api/register`
- `POST /login` or `POST /api/login`
- `POST /logout` or `POST /api/logout`
- `GET /movies` or `GET /api/movies`
- `GET /cities` or `GET /api/cities`
- `POST /book` or `POST /api/book`
- `GET /user/bookings` or `GET /api/user/bookings`
- `POST /book/:id/razorpay-order` or `POST /api/book/:id/razorpay-order`
- `POST /book/:id/razorpay-confirm` or `POST /api/book/:id/razorpay-confirm`
- `GET /movies/:movieId/reviews` or `GET /api/movies/:movieId/reviews`
- `POST /movies/:movieId/reviews` or `POST /api/movies/:movieId/reviews`
- `GET /user/watchlist` or `GET /api/user/watchlist`
- `POST /watchlist/:movieId` or `POST /api/watchlist/:movieId`
- `GET /admin/movies` or `GET /api/admin/movies`
- `POST /admin/movies` or `POST /api/admin/movies`
- `PUT /admin/movies/:id` or `PUT /api/admin/movies/:id`
- `DELETE /admin/movies/:id` or `DELETE /api/admin/movies/:id`

## Project Structure

```text
backend/
  controllers/
  middleware/
  routes/
  utils/
  server.js
data/
frontend/
  css/
  js/
  *.html
package.json
README.md
```
