const express = require("express");
const { sql } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// List current user's favorites
router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await sql`
      SELECT product_id, product_name, product_image, product_slug, created_at
      FROM favorites
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
    `;
    res.json({ favorites: rows });
  } catch (err) {
    console.error("List favorites error:", err);
    res.status(500).json({ error: "Could not load favorites." });
  }
});

// Toggle a product in/out of favorites. Returns { favorited: true|false }
router.post("/toggle", requireAuth, async (req, res) => {
  try {
    const { productId, name, image, slug } = req.body || {};
    if (!productId) {
      return res.status(400).json({ error: "productId is required." });
    }

    const existing = await sql`
      SELECT id FROM favorites WHERE user_id = ${req.user.id} AND product_id = ${String(productId)}
    `;

    if (existing.length > 0) {
      await sql`DELETE FROM favorites WHERE user_id = ${req.user.id} AND product_id = ${String(productId)}`;
      return res.json({ favorited: false });
    }

    await sql`
      INSERT INTO favorites (user_id, product_id, product_name, product_image, product_slug)
      VALUES (${req.user.id}, ${String(productId)}, ${name || null}, ${image || null}, ${slug || null})
    `;
    res.json({ favorited: true });
  } catch (err) {
    console.error("Toggle favorite error:", err);
    res.status(500).json({ error: "Could not update favorites." });
  }
});

module.exports = router;
