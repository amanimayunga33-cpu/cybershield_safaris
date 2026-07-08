/**
 * Amani Bus Booking System — Backend API
 * Stack: Node.js + Express + MySQL
 * Run: npm install && node server.js
 */
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { sendSMS } = require("./sms");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "amani_bus_booking",
  waitForConnections: true,
  connectionLimit: 10
});

const JWT_SECRET = process.env.JWT_SECRET || "amani-bus-secret-change-me";

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(header.replace("Bearer ", ""), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ---------------- AUTH ---------------- */
app.post("/api/register", async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || !email || !phone || !password)
    return res.status(400).json({ error: "All fields are required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password_hash) VALUES (?,?,?,?)",
      [full_name, email, phone, hash]
    );
    res.json({ message: "Registered successfully", user_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Registration failed", detail: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
  if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.user_id, name: user.full_name, role: user.role } });
});

/* ---------------- ROUTES / BUSES / TRIPS ---------------- */
app.get("/api/routes", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM routes WHERE status='active'");
  res.json(rows);
});

app.get("/api/buses", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.*, o.operator_name FROM buses b JOIN operators o ON b.operator_id=o.operator_id`
  );
  res.json(rows);
});

app.get("/api/trips", async (req, res) => {
  const { from, to, bus_type } = req.query;
  let sql = `SELECT t.*, r.from_location, r.to_location, r.estimated_time, b.bus_name, b.bus_type, o.operator_name
             FROM trips t
             JOIN routes r ON t.route_id = r.route_id
             JOIN buses b ON t.bus_id = b.bus_id
             JOIN operators o ON b.operator_id = o.operator_id
             WHERE t.status='scheduled'`;
  const params = [];
  if (from) { sql += " AND r.from_location=?"; params.push(from); }
  if (to) { sql += " AND r.to_location=?"; params.push(to); }
  if (bus_type) { sql += " AND b.bus_type=?"; params.push(bus_type); }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.get("/api/trips/:id/seats", async (req, res) => {
  const [trip] = await pool.query("SELECT bus_id FROM trips WHERE trip_id=?", [req.params.id]);
  if (trip.length === 0) return res.status(404).json({ error: "Trip not found" });
  const [seats] = await pool.query("SELECT * FROM seats WHERE bus_id=? ORDER BY seat_number", [trip[0].bus_id]);
  res.json(seats);
});

/* ---------------- BOOKINGS + PAYMENT + SMS ---------------- */
function genTicketCode() {
  return "ABK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

app.post("/api/bookings", auth, async (req, res) => {
  const { trip_id, seat_id, phone, payment_method } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [seatRows] = await conn.query("SELECT * FROM seats WHERE seat_id=? FOR UPDATE", [seat_id]);
    if (seatRows.length === 0 || seatRows[0].status === "booked") {
      await conn.rollback();
      return res.status(409).json({ error: "Seat already booked" });
    }

    const [tripRows] = await conn.query(
      `SELECT t.*, r.from_location, r.to_location FROM trips t JOIN routes r ON t.route_id=r.route_id WHERE t.trip_id=?`,
      [trip_id]
    );
    if (tripRows.length === 0) { await conn.rollback(); return res.status(404).json({ error: "Trip not found" }); }
    const trip = tripRows[0];
    const ticketCode = genTicketCode();

    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (user_id, trip_id, seat_id, total_fare, payment_status, ticket_code) VALUES (?,?,?,?,?,?)`,
      [req.user.user_id, trip_id, seat_id, trip.base_fare, "pending", ticketCode]
    );
    const bookingId = bookingResult.insertId;

    await conn.query("UPDATE seats SET status='booked' WHERE seat_id=?", [seat_id]);
    await conn.query("UPDATE trips SET available_seats = available_seats - 1 WHERE trip_id=?", [trip_id]);

    const txnRef = "TXN-" + Date.now();
    await conn.query(
      `INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_ref) VALUES (?,?,?,?,?)`,
      [bookingId, trip.base_fare, payment_method, "success", txnRef]
    );
    await conn.query("UPDATE bookings SET payment_status='paid', payment_ref=? WHERE booking_id=?", [txnRef, bookingId]);

    // Send SMS notification to passenger's phone
    const smsText = `Amani Bus: Ticket ${ticketCode} confirmed. ${trip.from_location} -> ${trip.to_location}. Paid TZS ${trip.base_fare}. Safe journey!`;
    const smsResult = await sendSMS(phone, smsText);
    await conn.query("UPDATE bookings SET sms_sent=? WHERE booking_id=?", [smsResult.success ? 1 : 0, bookingId]);

    await conn.commit();
    res.json({ message: "Booking confirmed", ticket_code: ticketCode, sms: smsResult });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: "Booking failed", detail: err.message });
  } finally {
    conn.release();
  }
});

app.get("/api/my-tickets", auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT bk.*, r.from_location, r.to_location, t.departure_datetime, s.seat_number
     FROM bookings bk
     JOIN trips t ON bk.trip_id=t.trip_id
     JOIN routes r ON t.route_id=r.route_id
     JOIN seats s ON bk.seat_id=s.seat_id
     WHERE bk.user_id=? ORDER BY bk.booking_date DESC`,
    [req.user.user_id]
  );
  res.json(rows);
});

/* ---------------- ADMIN ---------------- */
app.get("/api/admin/bookings", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admins only" });
  const [rows] = await pool.query(
    `SELECT bk.*, u.full_name, r.from_location, r.to_location FROM bookings bk
     JOIN users u ON bk.user_id=u.user_id
     JOIN trips t ON bk.trip_id=t.trip_id JOIN routes r ON t.route_id=r.route_id
     ORDER BY bk.booking_date DESC`
  );
  res.json(rows);
});

/* ---------------- AI CHAT PROXY (Amani AI) ---------------- */
// Forwards to the Python Flask AI microservice (see /python-ai). Falls back to a
// simple rule-based responder if the AI service is unavailable.
app.post("/api/ai-chat", async (req, res) => {
  const { message, lang } = req.body;
  try {
    const r = await fetch((process.env.AI_SERVICE_URL || "http://localhost:5001") + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, lang })
    });
    const data = await r.json();
    res.json(data);
  } catch {
    res.json({ reply: lang === "sw" ? "Samahani, Amani AI haipatikani kwa sasa." : "Sorry, Amani AI is temporarily unavailable." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Amani Bus Booking API running on port ${PORT}`));
