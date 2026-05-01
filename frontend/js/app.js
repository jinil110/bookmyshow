const API = "/api";
const state = { user: null };
const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);

window.addEventListener("load", () => setTimeout(() => document.body.classList.add("loaded"), 250));
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadUser();
  renderNav();
  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "login") initLogin();
  if (page === "register") initRegister();
  if (page === "contact") initContact();
  if (page === "profile") initProfile();
  if (page === "movie") initMovieDetails();
  if (page === "booking") initBookingPage();
  if (page === "seats") initSeatsPage();
  if (page === "payment") initPaymentPage();
  if (page === "confirmation") initConfirmation();
  if (page === "admin") initAdmin();
}

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

async function loadUser() {
  const data = await request("/me").catch(() => ({ user: null }));
  state.user = data.user;
}

function renderNav() {
  const page = document.body.dataset.page;
  $("#navbar").innerHTML = `<nav class="nav"><a class="brand" href="index.html">CineGo</a><div class="nav-links">
    ${navLink("Home", "index.html", page === "home")}
    ${navLink("About", "about.html", page === "about")}
    ${navLink("Contact", "contact.html", page === "contact")}
    ${state.user?.role === "admin" ? navLink("Admin", "admin.html", page === "admin") : ""}
    ${state.user ? navLink("Profile", "profile.html", page === "profile") : navLink("Login", "login.html", page === "login")}
    ${state.user ? `<button class="link-btn" id="logoutBtn">Logout</button>` : navLink("Register", "register.html", page === "register")}
  </div></nav>`;
  $("#logoutBtn")?.addEventListener("click", async () => {
    await request("/logout", { method: "POST" });
    toast("Logged out", "success");
    setTimeout(() => location.href = "index.html", 600);
  });
}

function navLink(text, href, active) {
  return `<a class="${active ? "active" : ""}" href="${href}">${text}</a>`;
}

function toast(message, type = "success") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  $("#toast").appendChild(item);
  setTimeout(() => item.remove(), 3400);
}

async function initHome() {
  const search = $("#searchMovies");
  const category = $("#categoryFilter");
  const load = async () => {
    const movies = await request(`/movies?search=${encodeURIComponent(search.value)}&category=${encodeURIComponent(category.value)}`);
    $("#movieGrid").innerHTML = movies.map(movieCard).join("") || `<p>No movies found.</p>`;
  };
  search.addEventListener("input", debounce(load, 250));
  category.addEventListener("change", load);
  await load();
}

function movieCard(movie) {
  return `<article class="movie-card"><img class="poster" src="${movie.poster}" alt="${movie.title} poster"><div class="movie-body">
    <h3>${movie.title}</h3><p>${movie.description}</p><div class="meta"><span class="badge">${movie.category}</span><span class="badge">${movie.duration}</span><span class="badge">${movie.rating}</span><span class="badge">Rs ${movie.price}</span></div>
    <p><a class="btn primary" href="movie.html?id=${movie.id}">View Details</a></p></div></article>`;
}

function initLogin() {
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await request("/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      toast("Login successful", "success");
      setTimeout(() => location.href = "index.html", 700);
    } catch (error) { toast(error.message, "error"); }
  });
}

function initRegister() {
  $("#registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await request("/register", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      toast("Registered successfully", "success");
      setTimeout(() => location.href = "index.html", 700);
    } catch (error) { toast(error.message, "error"); }
  });
}

function initContact() {
  $("#contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!event.target.checkValidity()) return toast("Please complete the contact form.", "error");
    event.target.reset();
    toast("Message sent successfully", "success");
  });
}

async function initMovieDetails() {
  const movie = await request(`/movies/${params.get("id")}`).catch((error) => {
    $("#movieDetails").innerHTML = `<section class="section narrow"><h1>${error.message}</h1></section>`;
  });
  if (!movie) return;
  $("#movieDetails").innerHTML = `<section class="detail-hero" style="background-image:linear-gradient(90deg,rgba(10,10,20,.9),rgba(10,10,20,.25)),url('${movie.banner}')"><div class="detail-box"><p class="eyebrow">${movie.category}</p><h1>${movie.title}</h1><p class="lead">${movie.description}</p><div class="meta"><span class="badge">${movie.duration}</span><span class="badge">${movie.rating}</span><span class="badge">Rs ${movie.price}</span></div><p><a class="btn primary" href="booking.html?id=${movie.id}">Book Tickets</a> <button class="btn secondary" id="watchlistBtn">Watchlist</button></p></div></section><section class="section narrow"><div class="section-head"><div><p class="eyebrow">Reviews</p><h2>Audience notes</h2></div></div>${state.user ? reviewForm() : "<p>Login to add a review.</p>"}<div id="reviews" class="review-list"></div></section>`;
  $("#watchlistBtn")?.addEventListener("click", async () => {
    if (!state.user) return forceLogin();
    const data = await request(`/watchlist/${movie.id}`, { method: "POST" });
    toast(data.message, "success");
  });
  $("#reviewForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await request(`/movies/${movie.id}/reviews`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      event.target.reset();
      toast("Review posted", "success");
      loadReviews(movie.id);
    } catch (error) { toast(error.message, "error"); }
  });
  loadReviews(movie.id);
}

function reviewForm() {
  return `<form id="reviewForm" class="form-card review-form"><div class="two"><label>Rating<select name="rating" required><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label><label>Comment<input name="comment" required minlength="3" placeholder="What did you think?"></label></div><button class="btn primary" type="submit">Post Review</button></form>`;
}

async function loadReviews(movieId) {
  const reviews = await request(`/movies/${movieId}/reviews`);
  $("#reviews").innerHTML = reviews.map((review) => `<article class="review"><strong>${"★".repeat(review.rating)} ${review.userName}</strong><p>${escapeHtml(review.comment)}</p><small>${formatDate(review.createdAt)}</small></article>`).join("") || "<p>No reviews yet.</p>";
}

async function initBookingPage() {
  if (!state.user) return forceLogin();
  const movie = await request(`/movies/${params.get("id")}`);
  $("#bookingMovie").innerHTML = `<div class="summary-card"><h2>${movie.title}</h2><p>${movie.description}</p><p><strong>Ticket price:</strong> Rs ${movie.price}</p></div>`;
  const select = document.querySelector("[name='showTime']");
  const showtimes = movie.showtimes?.length ? movie.showtimes : [new Date(Date.now() + 7200000).toISOString().slice(0, 16)];
  select.innerHTML = showtimes.map((time) => `<option value="${time}">${formatDate(time)}</option>`).join("");
  $("#showForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sessionStorage.setItem("draftBooking", JSON.stringify({ movieId: movie.id, showTime: select.value }));
    location.href = `seats.html?id=${movie.id}`;
  });
}

async function initSeatsPage() {
  if (!state.user) return forceLogin();
  const draft = JSON.parse(sessionStorage.getItem("draftBooking") || "{}");
  if (!draft.movieId) return location.href = `booking.html?id=${params.get("id")}`;
  const movie = await request(`/movies/${draft.movieId}`);
  const booked = await request(`/movies/${draft.movieId}/seats`);
  const selected = new Set();
  $("#seatGrid").innerHTML = buildSeats().map((seat) => `<button class="seat ${booked.seats.includes(seat) ? "booked" : ""}" data-seat="${seat}" ${booked.seats.includes(seat) ? "disabled" : ""}>${seat}</button>`).join("");
  $("#seatGrid").addEventListener("click", (event) => {
    const button = event.target.closest(".seat:not(.booked)");
    if (!button) return;
    const seat = button.dataset.seat;
    selected.has(seat) ? selected.delete(seat) : selected.add(seat);
    button.classList.toggle("selected");
    renderSeatSummary(movie, selected, draft);
  });
  renderSeatSummary(movie, selected, draft);
}

function renderSeatSummary(movie, selected, draft) {
  const list = [...selected];
  $("#seatSummary").innerHTML = `<div><strong>${movie.title}</strong><br>${list.length ? list.join(", ") : "No seats selected"}<br>Total: Rs ${list.length * movie.price}</div><button class="btn primary" ${!list.length ? "disabled" : ""} id="createBooking">Continue to Payment</button>`;
  $("#createBooking")?.addEventListener("click", async () => {
    try {
      const data = await request("/book", { method: "POST", body: JSON.stringify({ movieId: movie.id, seats: list, showTime: draft.showTime }) });
      sessionStorage.setItem("currentBooking", JSON.stringify(data.booking));
      location.href = `payment.html?id=${data.booking.id}`;
    } catch (error) { toast(error.message, "error"); }
  });
}

async function initPaymentPage() {
  if (!state.user) return forceLogin();
  const booking = JSON.parse(sessionStorage.getItem("currentBooking") || "null");
  if (!booking) return location.href = "profile.html";
  if (params.get("cancelled")) toast("Stripe payment was cancelled.", "error");
  $("#paymentSummary").innerHTML = summaryHtml(booking);
  $("#stripePay").addEventListener("click", async () => {
    try {
      const data = await request(`/book/${booking.id}/stripe-session`, { method: "POST" });
      if (data.paid) return location.href = "confirmation.html";
      location.href = data.url;
    } catch (error) { toast(error.message, "error"); }
  });
  $("#payNow").addEventListener("click", async () => {
    try {
      const data = await request(`/book/${booking.id}/pay`, { method: "POST" });
      sessionStorage.setItem("currentBooking", JSON.stringify(data.booking));
      toast(data.receipt?.sent ? "Payment successful. Receipt sent." : "Payment successful.", "success");
      setTimeout(() => location.href = "confirmation.html", 700);
    } catch (error) { toast(error.message, "error"); }
  });
}

async function initConfirmation() {
  if (params.get("booking") && params.get("session_id")) {
    try {
      const data = await request(`/book/${params.get("booking")}/stripe-confirm?session_id=${encodeURIComponent(params.get("session_id"))}`);
      sessionStorage.setItem("currentBooking", JSON.stringify(data.booking));
      toast(data.receipt?.sent ? "Stripe payment confirmed. Receipt sent." : "Stripe payment confirmed.", "success");
    } catch (error) { toast(error.message, "error"); }
  }
  const booking = JSON.parse(sessionStorage.getItem("currentBooking") || "null");
  $("#confirmationSummary").innerHTML = booking ? summaryHtml(booking) : "<p>No recent booking found.</p>";
}

async function initProfile() {
  if (!state.user) return forceLogin();
  $("#profilePanel").innerHTML = `<p class="eyebrow">Profile</p><h1>${state.user.name}</h1><p>${state.user.email}</p><p><strong>Role:</strong> ${state.user.role}</p>`;
  const [watchlist, bookings] = await Promise.all([
    request("/user/watchlist").catch(() => []),
    request("/user/bookings").catch((error) => {
      toast(error.message, "error");
      return [];
    })
  ]);
  $("#watchlistGrid").innerHTML = watchlist.map(movieCard).join("") || "<p>No saved movies yet.</p>";
  $("#bookingHistory").innerHTML = bookings.map((booking) => `<article class="booking-item"><div><h3>${booking.movieName}</h3><p>Seats: ${booking.seats.join(", ")} | Show: ${formatDate(booking.showTime)}</p><p>Booked: ${formatDate(booking.createdAt)}</p></div><div><p class="status">${booking.paymentStatus}</p><strong>Rs ${booking.amount}</strong></div></article>`).join("") || "<p>No bookings yet.</p>";
}

async function initAdmin() {
  if (!state.user) return forceLogin();
  if (state.user.role !== "admin") {
    toast("Admin access required", "error");
    return setTimeout(() => location.href = "index.html", 800);
  }
  const form = $("#movieAdminForm");
  const load = async () => {
    const movies = await request("/admin/movies");
    $("#adminMovieList").innerHTML = movies.map((movie) => `<article class="booking-item"><div><h3>${movie.title}</h3><p>${movie.category} | Rs ${movie.price}</p><p>${(movie.showtimes || []).map(formatDate).join(" | ") || "No showtimes"}</p></div><div><button class="btn secondary" data-edit="${movie.id}">Edit</button><button class="btn secondary" data-delete="${movie.id}">Delete</button></div></article>`).join("");
    $("#adminMovieList").onclick = async (event) => {
      const editId = event.target.dataset.edit;
      const deleteId = event.target.dataset.delete;
      if (editId) fillMovieForm(movies.find((movie) => movie.id === editId));
      if (deleteId && confirm("Delete this movie?")) {
        await request(`/admin/movies/${deleteId}`, { method: "DELETE" });
        toast("Movie deleted", "success");
        load();
      }
    };
  };
  $("#resetMovieForm").addEventListener("click", () => form.reset());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    const id = payload.id;
    delete payload.id;
    try {
      await request(id ? `/admin/movies/${id}` : "/admin/movies", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      form.reset();
      toast("Movie saved", "success");
      load();
    } catch (error) { toast(error.message, "error"); }
  });
  await load();
}

function fillMovieForm(movie) {
  const form = $("#movieAdminForm");
  for (const [key, value] of Object.entries(movie)) {
    if (form.elements[key]) form.elements[key].value = Array.isArray(value) ? value.join(", ") : value;
  }
}

function summaryHtml(booking) {
  return `<h2>${booking.movieName}</h2><p><strong>Seats:</strong> ${booking.seats.join(", ")}</p><p><strong>Show:</strong> ${formatDate(booking.showTime)}</p><p><strong>Amount:</strong> Rs ${booking.amount}</p><p><strong>Status:</strong> <span class="status">${booking.paymentStatus}</span></p>`;
}

function forceLogin() {
  toast("Please login first", "error");
  setTimeout(() => location.href = "login.html", 600);
}

function buildSeats() {
  return ["A", "B", "C", "D", "E", "F"].flatMap((row) => Array.from({ length: 10 }, (_, i) => `${row}${i + 1}`));
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
