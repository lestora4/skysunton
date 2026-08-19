require('dotenv').config();
const express = require("express");
const bcrypt = require("bcryptjs");
const { sql } = require("../db");
const { signToken, setAuthCookie, clearAuthCookie } = require("../middleware/auth");

const router = express.Router();

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Since signup only collects email/phone (no name field), we derive a friendly
// display name from the part of the email before the @ symbol.
function displayNameFromEmail(email) {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

router.post("/signup", async (req, res) => {
  try {
    let { email, password, phone } = req.body || {};
    email = (email || "").trim().toLowerCase();
    phone = (phone || "").trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (!phone) {
      return res.status(400).json({ error: "Please enter your phone number." });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password_hash, phone)
      VALUES (${email}, ${passwordHash}, ${phone})
      RETURNING id, email, phone
    `;
    const user = rows[0];

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ id: user.id, email: user.email, phone: user.phone, name: displayNameFromEmail(user.email) });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = (email || "").trim().toLowerCase();

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const rows = await sql`SELECT id, email, phone, password_hash FROM users WHERE email = ${email}`;
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ id: user.id, email: user.email, phone: user.phone, name: displayNameFromEmail(user.email) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  if (!req.user) {
    return res.json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    id: req.user.id,
    email: req.user.email,
    name: displayNameFromEmail(req.user.email),
  });
});

module.exports = router;
