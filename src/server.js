require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const { attachUser, requireAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const favoritesRoutes = require("./routes/favorites");
const newsletterRoutes = require("./routes/newsletter");

const app = express();
const PUBLIC_DIR = path.join(__dirname, "..", "public");

app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

// ---------- API routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/newsletter", newsletterRoutes);

// ---------- Clean URL page routes (no .html) ----------
// HTML always revalidates so page edits/deploys show up right away.
const sendHtml = (res, file) =>
  res.sendFile(path.join(PUBLIC_DIR, file), {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
  });
app.get("/", (req, res) => sendHtml(res, "index.html"));
app.get("/about", (req, res) => sendHtml(res, "about.html"));
app.get("/shop", (req, res) => sendHtml(res, "shop.html"));
app.get("/product", (req, res) => sendHtml(res, "product.html"));
app.get("/contact", (req, res) => sendHtml(res, "contact.html"));
app.get("/privacy", (req, res) => sendHtml(res, "privacy.html"));
app.get("/terms", (req, res) => sendHtml(res, "terms.html"));
app.get("/login", (req, res) => sendHtml(res, "login.html"));
app.get("/signup", (req, res) => sendHtml(res, "signup.html"));
app.get("/dashboard", requireAuth, (req, res) => sendHtml(res, "dashboard.html"));

// 301 redirect any legacy *.html requests to their clean equivalents (keeps old links / bookmarks working)
const htmlToClean = {
  "index.html": "/",
  "about.html": "/about",
  "shop.html": "/shop",
  "product.html": "/product",
  "contact.html": "/contact",
  "privacy.html": "/privacy",
  "terms.html": "/terms",
};
app.get("/:page.html", (req, res, next) => {
  const target = htmlToClean[`${req.params.page}.html`];
  if (target) {
    const qs = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
    return res.redirect(301, target + qs);
  }
  next();
});

// ---------- Static assets (css, images, js, webflow assets) ----------
// Every request (including images) is rewritten to this one serverless function
// (see vercel.json), so Vercel's automatic static-file edge caching does NOT
// apply here - the function's own response headers are what get cached.
// Explicit Cache-Control below is what makes Vercel cache these at the edge.
const LONG_CACHE_EXT = new Set([
  ".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf",
]);
const DAY_CACHE_EXT = new Set([".css", ".js"]);

app.use(
  express.static(PUBLIC_DIR, {
    extensions: [],
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (LONG_CACHE_EXT.has(ext)) {
        // Images/fonts are content-addressed by filename in this project
        // (a changed image gets a new filename), so cache them hard for a year.
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (DAY_CACHE_EXT.has(ext)) {
        // CSS/JS can change without a filename change, so cache for a day
        // and let the browser/edge revalidate after that.
        res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate");
      } else {
        // HTML and anything else: always revalidate so content edits show up immediately.
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    },
  })
);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404);
  sendHtml(res, "index.html");
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sky Sunton server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
