
const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

const usersFile = path.join(__dirname, 'data', 'users.json');
const bookingsFile = path.join(__dirname, 'data', 'bookings.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'hotgarbage_secret',
  resave: false,
  saveUninitialized: false
}));

function readJson(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  const users = readJson(usersFile);
  const user = users.find(u => u.phone === phone && u.password === password);
  if (user) {
    req.session.user = user;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid phone or password' });
  }
});

app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

app.post('/api/book', (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: 'Unauthorized' });

  const { service, date, notes } = req.body;
  if (!service || !date) return res.json({ success: false, message: 'Please provide all required fields.' });

  const bookings = readJson(bookingsFile);
  bookings.push({
    phone: req.session.user.phone,
    service,
    date,
    notes,
    status: "Pending"
  });
  writeJson(bookingsFile, bookings);

  res.json({ success: true, message: 'Booking submitted!' });
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.listen(PORT, () => {
  console.log(`🔥 Server running at http://localhost:${PORT}`);
});
