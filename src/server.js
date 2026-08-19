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
app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
app.get("/about", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "about.html")));
app.get("/shop", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "shop.html")));
app.get("/product", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "product.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "contact.html")));
app.get("/privacy", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "privacy.html")));
app.get("/terms", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "terms.html")));
app.get("/login", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "signup.html")));
app.get("/dashboard", requireAuth, (req, res) => res.sendFile(path.join(PUBLIC_DIR, "dashboard.html")));

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
app.use(express.static(PUBLIC_DIR, { extensions: [] }));

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sky Sunton server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
