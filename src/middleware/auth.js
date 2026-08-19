require('dotenv').config();
const jwt = require("jsonwebtoken");

const COOKIE_NAME = "skysunton_session";

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to your .env file / Vercel environment variables.");
  }
  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, getSecret(), { expiresIn: "30d" });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// Attaches req.user if a valid session cookie is present. Never blocks the request.
function attachUser(req, res, next) {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  if (token) {
    try {
      req.user = jwt.verify(token, getSecret());
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// Blocks the request unless logged in.
function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ error: "Not logged in" });
    }
    return res.redirect("/login");
  }
  next();
}

module.exports = { COOKIE_NAME, signToken, setAuthCookie, clearAuthCookie, attachUser, requireAuth };
