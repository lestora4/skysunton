const express = require("express");
const { sql } = require("../db");

const router = express.Router();

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", async (req, res) => {
  try {
    let { email } = req.body || {};
    email = (email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    await sql`
      INSERT INTO newsletter_subscribers (email)
      VALUES (${email})
      ON CONFLICT (email) DO NOTHING
    `;

    res.json({ ok: true });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
