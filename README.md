# CineGo - BookMyShow-like Web App

A complete movie ticket booking application built with HTML5, CSS3, vanilla JavaScript, Node.js, Express.js, bcrypt, express-session, and JSON-file persistence.

## Features

- User registration, login, logout, and session authentication
- Password hashing with bcrypt
- Movies stored in `data/movies.json`
- Users stored in `data/users.json`
- Bookings stored in `data/bookings.json`
- Movie search and category filtering
- Movie details, booking flow, seat selection, fake payment, and confirmation pages
- User profile with previous booking history
- Email receipts using Resend or SendGrid when keys are configured
- Admin panel for movie and showtime CRUD
- Per-movie reviews and user watchlist
- Stripe Checkout integration through the `stripe` npm package
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

Stripe:

- Add a real test key from [dashboard.stripe.com](https://dashboard.stripe.com): `STRIPE_SECRET_KEY=sk_test_...`
- Set `APP_URL=http://localhost:3000`
- Use "Pay with Stripe" on the payment page

Email receipts:

- Use either `RESEND_API_KEY` or `SENDGRID_API_KEY`
- Set `EMAIL_FROM` to a verified sender for your provider

## Main API Routes

- `POST /register` or `POST /api/register`
- `POST /login` or `POST /api/login`
- `POST /logout` or `POST /api/logout`
- `GET /movies` or `GET /api/movies`
- `POST /book` or `POST /api/book`
- `GET /user/bookings` or `GET /api/user/bookings`
- `POST /book/:id/stripe-session` or `POST /api/book/:id/stripe-session`
- `GET /book/:id/stripe-confirm` or `GET /api/book/:id/stripe-confirm`
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
  users.json
  movies.json
  bookings.json
frontend/
  css/
  js/
  *.html
package.json
README.md
```
