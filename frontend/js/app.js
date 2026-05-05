// ═══════════════════════════════════════════════
//  CineGo — Frontend App (Unified SPA Logic)
// ═══════════════════════════════════════════════

// ─── Utilities ───────────────────────────────
const $ = id => document.getElementById(id);
const PAGE = document.body.dataset.page;
const CITY_KEY = 'cinego_selected_city';
const DEFAULT_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad'];

// User's real timezone
const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function fmtTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', timeZone: USER_TZ
  });
}

function fmtDateTime(isoStr) {
  return new Date(isoStr).toLocaleString([], {
    dateStyle: 'medium', timeStyle: 'short', timeZone: USER_TZ
  });
}

function fmtDate(isoStr) {
  return new Date(isoStr).toLocaleDateString([], {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: USER_TZ
  });
}

// ─── Toast ───────────────────────────────────
function toast(msg, type = 'info') {
  const t = $('toast');
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  t.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ─── API ─────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : {};
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Navbar ──────────────────────────────────
async function renderNav() {
  let user = null;
  let cities = [];
  const selectedCity = localStorage.getItem(CITY_KEY) || 'Mumbai';
  try { const d = await api('/auth/me'); user = d.user; } catch (e) { /* not logged in */ }
  try { cities = await api('/cities'); } catch (e) { cities = []; }
  const allCities = cities.length ? cities : DEFAULT_CITIES;
  const cityOptions = allCities
    .map(city => `<option value="${city}" ${selectedCity === city ? 'selected' : ''}>${city}</option>`)
    .join('');
  const nav = $('navbar');
  nav.innerHTML = `
    <div class="nav-inner">
      <a class="nav-logo" href="/">🎬 CineGo</a>
      <div class="city-picker-wrap">
        <label for="citySelect" class="city-label">City</label>
        <select id="citySelect" class="city-select" aria-label="Select city">${cityOptions}</select>
        <button id="detectCityBtn" class="detect-city-btn" title="Detect nearest city" aria-label="Detect nearest city">📍</button>
      </div>
      <nav class="nav-links">
        <a href="index.html">Home</a>
        ${user ? `
          <a href="profile.html">My Tickets</a>
          <button id="logoutBtn">Logout</button>
        ` : `
          <a href="login.html">Login</a>
          <a class="btn-accent" href="register.html">Sign Up</a>
        `}
      </nav>
    </div>
  `;
  const citySelect = $('citySelect');
  if (citySelect) {
    citySelect.addEventListener('change', () => {
      localStorage.setItem(CITY_KEY, citySelect.value);
      if (PAGE === 'movie') {
        initMovie();
        return;
      }
      location.reload();
    });
  }
  $('detectCityBtn')?.addEventListener('click', async () => {
    const detected = await detectNearestCity(allCities);
    if (!detected) {
      toast('Could not detect city. Select manually.', 'info');
      return;
    }
    localStorage.setItem(CITY_KEY, detected);
    if (citySelect) citySelect.value = detected;
    toast(`Location detected: ${detected}`, 'success');
    setTimeout(() => location.reload(), 350);
  });
  if (user) {
    $('logoutBtn').onclick = async () => {
      await api('/auth/logout', { method: 'POST' });
      window.location.href = '/';
    };
  }
}

function cityAliases(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');
}

function matchCityFromText(text, cities) {
  const normalizedText = cityAliases(text);
  for (const city of cities) {
    const normalizedCity = cityAliases(city);
    if (normalizedText.includes(normalizedCity)) return city;
    if (normalizedCity === 'bengaluru' && normalizedText.includes('bangalore')) return city;
  }
  return null;
}

function guessCityByTimezone(cities) {
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
  const byTz = {
    'asia/kolkata': 'Mumbai'
  };
  const guess = byTz[tz];
  return guess && cities.includes(guess) ? guess : null;
}

async function detectNearestCity(cities) {
  if (!cities.length) return null;

  // Fast fallback before geolocation prompts.
  const localeGuess = matchCityFromText(navigator.language || '', cities);
  if (localeGuess) return localeGuess;
  const tzGuess = guessCityByTimezone(cities);
  if (tzGuess) return tzGuess;

  if (!navigator.geolocation) return null;
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 300000
      });
    });

    const { latitude, longitude } = position.coords;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const areaText = [
      data?.address?.city,
      data?.address?.town,
      data?.address?.state_district,
      data?.address?.state,
      data?.display_name
    ].filter(Boolean).join(' ');
    return matchCityFromText(areaText, cities);
  } catch (_err) {
    return null;
  }
}

// ─── Movie Card ──────────────────────────────
function movieCardHTML(m) {
  const id = m._id || m.id;
  return `
    <div class="movie-card" onclick="window.location='movie.html?id=${id}'">
      <div class="movie-card-img">
        <img src="${m.poster}" alt="${m.title}" loading="lazy">
        <span class="movie-card-badge">${m.rating || 'UA'}</span>
        ${m.isTrending ? '<span class="trending-badge">🔥 Trending</span>' : ''}
      </div>
      <div class="movie-card-body">
        <h3>${m.title}</h3>
        <div class="movie-card-meta">
          <span class="tag genre">${m.category}</span>
          <span class="tag">${m.duration}</span>
        </div>
      </div>
    </div>
  `;
}

// ─── HIDE LOADER ─────────────────────────────
function hideLoader() {
  const l = $('loader');
  if (l) { l.classList.add('hidden'); }
}

// ─── Smooth reveal animations ─────────────────
function initRevealAnimations() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
}

// ══════════════════════════════════════════════
//  HOME PAGE
// ══════════════════════════════════════════════
async function initHome() {
  let allMovies = [];
  try {
    allMovies = await api('/movies');
  } catch (e) {
    toast('Could not load movies. Is the server running?', 'error');
    hideLoader(); return;
  }

  // Hero: pick first trending movie
  const trending = allMovies.filter(m => m.isTrending);
  const hero = trending[0] || allMovies[0];
  if (hero) renderHero(hero);

  // Trending strip
  const tGrid = $('trendingGrid');
  if (tGrid) {
    tGrid.innerHTML = (trending.length ? trending : allMovies.slice(0, 6))
      .map(movieCardHTML).join('');
  }

  // Main grid
  renderMovieGrid(allMovies);

  // Search / filter
  let debounce;
  const search = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = ($('searchMovies').value || '').toLowerCase();
      const cat = $('categoryFilter').value;
      const filtered = allMovies.filter(m => {
        const matchQ = !q || (m.title + m.description + m.category).toLowerCase().includes(q);
        const matchC = cat === 'All' || m.category === cat;
        return matchQ && matchC;
      });
      renderMovieGrid(filtered);
    }, 250);
  };
  $('searchMovies')?.addEventListener('input', search);
  $('categoryFilter')?.addEventListener('change', search);

  hideLoader();
}

function renderHero(m) {
  const bg = $('heroBg');
  const title = $('heroTitle');
  const meta = $('heroMeta');
  const desc = $('heroDesc');
  const btn = $('heroBookBtn');

  if (bg) bg.style.backgroundImage = `url('${m.banner || m.poster}')`;
  if (title) title.textContent = m.title;
  if (desc) desc.textContent = m.description
    ? `${m.description.substring(0, 160)}...`
    : 'Book premium seats, skip queues, and enjoy seamless movie nights.';
  if (btn) btn.href = `movie.html?id=${m._id || m.id}`;
  if (meta) meta.innerHTML = `
    <span><span class="rating-badge">${m.rating}</span></span>
    <span>🎭 ${m.category}</span>
    <span>⏱ ${m.duration}</span>
  `;
}

function renderMovieGrid(movies) {
  const grid = $('movieGrid');
  if (!grid) return;
  if (!movies.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No movies found</p></div>`;
    return;
  }
  grid.innerHTML = movies.map(movieCardHTML).join('');
  grid.querySelectorAll('.movie-card').forEach((card, index) => {
    card.style.animationDelay = `${Math.min(index * 70, 600)}ms`;
  });
}

// ══════════════════════════════════════════════
//  MOVIE DETAIL PAGE
// ══════════════════════════════════════════════
async function initMovie() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = '/'; return; }
  const city = localStorage.getItem(CITY_KEY) || 'Mumbai';

  let data;
  try { data = await api(`/movies/${id}?city=${encodeURIComponent(city)}`); }
  catch (e) { toast('Movie not found', 'error'); hideLoader(); return; }

  const { movie, showtimes } = data;

  // Hero
  const bg = $('movieHeroBg');
  if (bg) bg.style.setProperty('--banner', `url('${movie.banner || movie.poster}')`);
  // Fix: use style directly
  if (bg) bg.style.backgroundImage = `url('${movie.banner || movie.poster}')`;

  $('moviePoster').src = movie.poster;
  $('moviePoster').alt = movie.title;
  $('movieTitle').textContent = movie.title;
  $('movieDesc').textContent = movie.description;
  $('movieTags').innerHTML = `
    <span class="tag genre">${movie.category}</span>
    <span class="tag">⏱ ${movie.duration}</span>
    <span class="tag">🎬 ${movie.rating}</span>
    ${movie.isTrending ? '<span class="tag" style="color:var(--accent)">🔥 Trending</span>' : ''}
  `;

  // Watchlist button
  const wlBtn = $('watchlistBtn');
  wlBtn?.addEventListener('click', async () => {
    try {
      const d = await api(`/movies/${id}/watchlist`, { method: 'POST' });
      toast(d.message, 'success');
    } catch (e) {
      if (e.message.includes('login')) { location.href = 'login.html'; return; }
      toast(e.message, 'error');
    }
  });

  // Showtimes — BookMyShow style
  renderShowtimes(showtimes, movie, city);

  // Reviews
  loadReviews(id);

  hideLoader();
}

function renderShowtimes(showtimes, movie, city) {
  const dateTabs = $('dateTabs');
  const theaterShows = $('theaterShows');
  if (!dateTabs || !theaterShows) return;

  const dates = Object.keys(showtimes || {}).sort();
  if (!dates.length) {
    theaterShows.innerHTML = '<p style="color:var(--text3)">No shows available at the moment.</p>';
    return;
  }

  // Render date tabs
  dateTabs.innerHTML = dates.map((d, i) => {
    const dateObj = new Date(d + 'T00:00:00');
    const day = dateObj.toLocaleDateString([], { weekday: 'short' });
    const num = dateObj.getDate();
    const mon = dateObj.toLocaleDateString([], { month: 'short' });
    return `
      <div class="date-tab ${i === 0 ? 'active' : ''}" data-date="${d}">
        <div class="day">${day}</div>
        <div class="date-num">${num}</div>
        <div class="month">${mon}</div>
      </div>
    `;
  }).join('');

  const renderShowsForDate = (date) => {
    const shows = showtimes[date] || [];
    // Group by theater
      const byTheater = {};
    shows.forEach(show => {
      const key = `${show.theaterName}||${show.area || ''}`;
      if (!byTheater[key]) byTheater[key] = [];
      byTheater[key].push(show);
    });

    theaterShows.innerHTML = Object.entries(byTheater).map(([key, tShows]) => {
      const [theater, area] = key.split('||');
      const slots = tShows.map(s => {
        const isPast = new Date(s.time) < new Date();
        return `
          <div class="time-slot ${isPast ? 'past' : ''}"
            data-show-id="${s._id}"
            data-price="${s.price}"
            ${isPast ? '' : `onclick="window.location='seats.html?showId=${s._id}&movie=${movie._id}'"` }>
            ${fmtTime(s.time)}
            <br><small style="font-size:0.65rem;opacity:0.7">₹${s.price}</small>
          </div>
        `;
      }).join('');
      return `
        <div class="theater-block">
          <div class="theater-name">${theater}</div>
          <p class="theater-sub">${area ? `${area}, ` : ''}${city} • ${USER_TZ}</p>
          <div class="time-slots">${slots}</div>
        </div>
      `;
    }).join('');
  };

  renderShowsForDate(dates[0]);

  dateTabs.querySelectorAll('.date-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      dateTabs.querySelectorAll('.date-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderShowsForDate(tab.dataset.date);
    });
  });
}

async function loadReviews(movieId) {
  try {
    const reviews = await api(`/movies/${movieId}/reviews`);
    const list = $('reviewsList');
    if (!list) return;
    if (!reviews.length) {
      list.innerHTML = '<p style="color:var(--text3)">No reviews yet. Be the first!</p>';
    } else {
      list.innerHTML = reviews.map(r => `
        <div class="summary-card" style="margin:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong>${r.userName}</strong>
            <span style="color:var(--gold)">${'⭐'.repeat(r.rating)}</span>
          </div>
          <p style="color:var(--text2);font-size:0.9rem">${r.comment}</p>
        </div>
      `).join('');
    }

    // Check if user logged in to show review form
    const me = await api('/auth/me');
    if (me.user) {
      const rf = $('reviewForm');
      if (rf) rf.style.display = 'block';
      $('submitReview')?.addEventListener('click', async () => {
        try {
          await api(`/movies/${movieId}/reviews`, {
            method: 'POST',
            body: { rating: +$('reviewRating').value, comment: $('reviewComment').value }
          });
          toast('Review posted!', 'success');
          loadReviews(movieId);
        } catch (e) { toast(e.message, 'error'); }
      });
    }
  } catch (e) { /* skip */ }
}

// ══════════════════════════════════════════════
//  SEATS PAGE
// ══════════════════════════════════════════════
async function initSeats() {
  const params = new URLSearchParams(location.search);
  const showId = params.get('showId');
  const movieId = params.get('movie');
  if (!showId) { location.href = '/'; return; }

  let show, bookedSeats = [];
  try {
    const d = await api(`/shows/${showId}/seats`);
    bookedSeats = d.seats || [];
  } catch (e) { /* first load */ }

  // Get movie details for title
  let movieTitle = 'Movie';
  try {
    const md = await api(`/movies/${movieId}`);
    movieTitle = md.movie?.title || 'Movie';
    $('seatMovieTitle').textContent = movieTitle;
    $('seatMeta').textContent = `Show ID: ${showId} • ${USER_TZ}`;
  } catch (e) { /* skip */ }

  const basicPrice = 180;
  const premiumPrice = 300;
  $('basicPrice').textContent = basicPrice;
  $('premiumPrice').textContent = premiumPrice;

  const selectedSeats = new Set();

  const renderSeats = (gridId, rows, pricePerSeat, cls) => {
    const grid = $(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    rows.forEach(row => {
      for (let i = 1; i <= 8; i++) {
        const seatId = `${row}${i}`;
        const btn = document.createElement('button');
        btn.className = `seat ${cls} ${bookedSeats.includes(seatId) ? 'booked' : ''}`;
        btn.textContent = seatId;
        btn.dataset.seat = seatId;
        btn.dataset.price = pricePerSeat;
        if (!bookedSeats.includes(seatId)) {
          btn.addEventListener('click', () => {
            if (selectedSeats.has(seatId)) {
              selectedSeats.delete(seatId);
              btn.classList.remove('selected');
            } else {
              selectedSeats.add(seatId);
              btn.classList.add('selected');
            }
            updateSummary();
          });
        }
        grid.appendChild(btn);
      }
    });
  };

  renderSeats('seatGridBasic', ['A', 'B', 'C', 'D'], basicPrice, '');
  renderSeats('seatGridPremium', ['E', 'F'], premiumPrice, 'premium');

  const summaryBar = $('seatSummary');
  const proceedBtn = $('proceedBtn');

  const updateSummary = () => {
    let total = 0;
    selectedSeats.forEach(seat => {
      total += seat.startsWith('E') || seat.startsWith('F') ? premiumPrice : basicPrice;
    });
    $('selectedSeatsLabel').textContent = selectedSeats.size
      ? `${selectedSeats.size} seat(s): ${[...selectedSeats].join(', ')}`
      : 'No seats selected';
    $('totalPriceLabel').textContent = `₹${total}`;
    proceedBtn.disabled = selectedSeats.size === 0;
    if (selectedSeats.size > 0) summaryBar.classList.add('visible');
    else summaryBar.classList.remove('visible');
  };

  proceedBtn?.addEventListener('click', async () => {
    try {
      const user = (await api('/auth/me')).user;
      if (!user) { toast('Please login first', 'error'); location.href = 'login.html'; return; }
      const d = await api('/book', {
        method: 'POST',
        body: { showId, seats: [...selectedSeats], timezone: USER_TZ }
      });
      location.href = `payment.html?bookingId=${d.booking._id}`;
    } catch (e) {
      if (e.message.includes('login')) { location.href = 'login.html'; return; }
      toast(e.message, 'error');
    }
  });

  hideLoader();
}

// ══════════════════════════════════════════════
//  PAYMENT PAGE
// ══════════════════════════════════════════════
async function initPayment() {
  const bookingId = new URLSearchParams(location.search).get('bookingId');
  if (!bookingId) { location.href = '/'; return; }

  let booking;
  try {
    const bookings = await api('/user/bookings');
    booking = bookings.find(b => b._id === bookingId);
  } catch (e) {
    toast('Please login to continue', 'error');
    location.href = 'login.html'; return;
  }

  if (!booking) { toast('Booking not found', 'error'); hideLoader(); return; }

  const summary = $('paymentSummary');
  const show = booking.show || {};
  const movie = show.movie || {};
  const showTime = show.time ? fmtDateTime(show.time) : 'N/A';

  summary.innerHTML = `
    <h3>Booking Summary</h3>
    <div class="summary-row">
      <span class="label">Movie</span>
      <span class="value">${movie.title || 'N/A'}</span>
    </div>
    <div class="summary-row">
      <span class="label">Show Time</span>
      <span class="value">${showTime} <small style="color:var(--text3)">(${USER_TZ})</small></span>
    </div>
    <div class="summary-row">
      <span class="label">Theater</span>
      <span class="value">${show.theaterName || 'N/A'}</span>
    </div>
    <div class="summary-row">
      <span class="label">Seats</span>
      <span class="value">${(booking.seats || []).join(', ')}</span>
    </div>
    <div class="summary-row total">
      <span class="label">Total Amount</span>
      <span class="value">₹${booking.totalAmount}</span>
    </div>
  `;

  // Razorpay Pay button
  $('razorpayBtn')?.addEventListener('click', async () => {
    try {
      const order = await api(`/book/${bookingId}/razorpay-order`, { method: 'POST' });

      if (order.mock) {
        // Mock payment - confirm immediately
        await api(`/book/${bookingId}/razorpay-confirm`, {
          method: 'POST',
          body: { mock: true }
        });
        toast('Payment successful!', 'success');
        setTimeout(() => { location.href = `confirmation.html?bookingId=${bookingId}`; }, 1000);
        return;
      }

      // Real Razorpay
      const options = {
        key: order.key_id || '',
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.id,
        name: 'CineGo',
        description: `Tickets for ${movie.title}`,
        handler: async function(resp) {
          await api(`/book/${bookingId}/razorpay-confirm`, {
            method: 'POST',
            body: {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature
            }
          });
          toast('Payment successful!', 'success');
          setTimeout(() => { location.href = `confirmation.html?bookingId=${bookingId}`; }, 800);
        },
        theme: { color: '#e50914' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  // Demo pay button
  $('demoPay')?.addEventListener('click', async () => {
    try {
      await api(`/book/${bookingId}/razorpay-order`, { method: 'POST' });
      await api(`/book/${bookingId}/razorpay-confirm`, { method: 'POST', body: { mock: true } });
      toast('Demo payment successful!', 'success');
      setTimeout(() => { location.href = `confirmation.html?bookingId=${bookingId}`; }, 800);
    } catch (e) { toast(e.message, 'error'); }
  });

  hideLoader();
}

// ══════════════════════════════════════════════
//  CONFIRMATION PAGE
// ══════════════════════════════════════════════
async function initConfirmation() {
  const bookingId = new URLSearchParams(location.search).get('bookingId');
  if (!bookingId) { hideLoader(); return; }
  try {
    const bookings = await api('/user/bookings');
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) { hideLoader(); return; }
    const show = booking.show || {};
    const movie = show.movie || {};
    $('confirmationSummary').innerHTML = `
      <div class="summary-card" style="text-align:left">
        <div class="summary-row"><span class="label">Movie</span><span class="value">${movie.title || 'N/A'}</span></div>
        <div class="summary-row"><span class="label">Theater</span><span class="value">${show.theaterName || 'N/A'}</span></div>
        <div class="summary-row"><span class="label">Show Time</span><span class="value">${show.time ? fmtDateTime(show.time) : 'N/A'}</span></div>
        <div class="summary-row"><span class="label">Seats</span><span class="value">${(booking.seats || []).join(', ')}</span></div>
        <div class="summary-row total"><span class="label">Total Paid</span><span class="value">₹${booking.totalAmount}</span></div>
      </div>
      <p style="color: var(--success); font-weight: 600; margin-top: 20px;">
        ✉️ A booking confirmation has been sent to your email inbox.
      </p>
    `;
  } catch (e) { /* skip */ }
  hideLoader();
}

// ══════════════════════════════════════════════
//  PROFILE PAGE
// ══════════════════════════════════════════════
async function initProfile() {
  let user;
  try {
    const d = await api('/auth/me');
    user = d.user;
    if (!user) { location.href = 'login.html'; return; }
  } catch (e) { location.href = 'login.html'; return; }

  const panel = $('profilePanel');
  if (panel) {
    panel.innerHTML = `
      <div class="avatar">${user.name[0].toUpperCase()}</div>
      <div class="profile-info">
        <h2>${user.name}</h2>
        <p>${user.email}</p>
        <p style="margin-top:6px;font-size:0.8rem;color:var(--text3)">📍 ${USER_TZ}</p>
      </div>
    `;
  }

  // Watchlist
  try {
    const wl = await api('/user/watchlist');
    const wGrid = $('watchlistGrid');
    if (wGrid) {
      wGrid.innerHTML = wl.length
        ? wl.map(movieCardHTML).join('')
        : '<p style="color:var(--text3)">No saved movies.</p>';
    }
  } catch (e) { /* skip */ }

  // Bookings
  try {
    const bookings = await api('/user/bookings');
    const bList = $('bookingHistory');
    if (bList) {
      if (!bookings.length) {
        bList.innerHTML = '<p style="color:var(--text3)">No bookings yet.</p>';
      } else {
        bList.innerHTML = bookings.map(b => {
          const show = b.show || {};
          const movie = show.movie || {};
          return `
            <div class="booking-item">
              <img class="booking-item-poster" src="${movie.poster || ''}" alt="${movie.title || ''}">
              <div class="booking-item-info">
                <h4>${movie.title || 'Unknown Movie'}</h4>
                <p>🎭 ${show.theaterName || 'N/A'} &nbsp;|&nbsp; 💺 ${(b.seats || []).join(', ')}</p>
                <p>🕒 ${show.time ? fmtDateTime(show.time) : 'N/A'} <small style="color:var(--text3)">(${USER_TZ})</small></p>
                <p style="color:var(--gold);font-weight:700">₹${b.totalAmount}</p>
              </div>
              <span class="booking-status ${b.status}">${b.status}</span>
            </div>
          `;
        }).join('');
      }
    }
  } catch (e) { /* skip */ }

  hideLoader();
}

// ══════════════════════════════════════════════
//  AUTH PAGES
// ══════════════════════════════════════════════
function initLogin() {
  $('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('loginEmail').value;
    const password = $('loginPassword').value;
    try {
      await api('/auth/login', { method: 'POST', body: { email, password } });
      toast('Welcome back! 🎬', 'success');
      setTimeout(() => { location.href = '/'; }, 800);
    } catch (err) { toast(err.message, 'error'); }
  });
  hideLoader();
}

function initRegister() {
  $('registerForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('regName').value;
    const email = $('regEmail').value;
    const password = $('regPassword').value;
    try {
      await api('/auth/register', { method: 'POST', body: { name, email, password } });
      toast('Account created! Welcome 🎉', 'success');
      setTimeout(() => { location.href = '/'; }, 800);
    } catch (err) { toast(err.message, 'error'); }
  });
  hideLoader();
}

// ══════════════════════════════════════════════
//  ROUTER
// ══════════════════════════════════════════════
async function main() {
  await renderNav();
  initRevealAnimations();
  switch (PAGE) {
    case 'home':         await initHome(); break;
    case 'movie':        await initMovie(); break;
    case 'seats':        await initSeats(); break;
    case 'payment':      await initPayment(); break;
    case 'confirmation': await initConfirmation(); break;
    case 'profile':      await initProfile(); break;
    case 'login':        initLogin(); break;
    case 'register':     initRegister(); break;
    default:             hideLoader();
  }
}

main().catch(err => { console.error(err); hideLoader(); });
