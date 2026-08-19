(function () {
  "use strict";

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function renderFavorites(favorites, name) {
    var welcome = document.getElementById("dashboardWelcome");
    var sub = document.getElementById("dashboardSub");
    var container = document.getElementById("favoritesContainer");

    if (welcome) welcome.textContent = "Hi, " + name;
    if (sub) sub.textContent = favorites.length + (favorites.length === 1 ? " saved favorite" : " saved favorites");

    if (!favorites.length) {
      container.innerHTML =
        '<div class="dashboard-empty">You haven\'t saved any favorites yet. <a href="/shop">Browse the shop</a></div>';
      return;
    }

    var html = '<div class="favorites-grid">';
    favorites.forEach(function (f) {
      var slug = f.product_slug || f.product_id;
      var image = f.product_image ? "/images/products/" + escapeHtml(f.product_image) : "";
      html +=
        '<div class="favorite-card" data-product-id="' + escapeHtml(f.product_id) + '">' +
        (image ? '<img class="favorite-card-img" src="' + image + '" alt="' + escapeHtml(f.product_name || "") + '">' : "") +
        '<div class="favorite-card-body">' +
        '<div class="favorite-card-name">' + escapeHtml(f.product_name || "Product") + "</div>" +
        '<div class="favorite-card-actions">' +
        '<a href="/product?id=' + encodeURIComponent(slug) + '">View</a>' +
        '<button type="button" class="remove-fav-btn" data-id="' + escapeHtml(f.product_id) + '">Remove</button>' +
        "</div></div></div>";
    });
    html += "</div>";
    container.innerHTML = html;
  }

  function removeFavorite(productId, btn) {
    btn.disabled = true;
    fetch("/api/favorites/toggle", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: productId }),
    })
      .then(function (r) { return r.json(); })
      .then(function () {
        var card = btn.closest(".favorite-card");
        if (card) card.remove();
        var remaining = document.querySelectorAll(".favorite-card").length;
        var sub = document.getElementById("dashboardSub");
        if (sub) sub.textContent = remaining + (remaining === 1 ? " saved favorite" : " saved favorites");
        if (remaining === 0) {
          document.getElementById("favoritesContainer").innerHTML =
            '<div class="dashboard-empty">You haven\'t saved any favorites yet. <a href="/shop">Browse the shop</a></div>';
        }
      })
      .catch(function () {
        btn.disabled = false;
      });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".remove-fav-btn") : null;
    if (!btn) return;
    removeFavorite(btn.getAttribute("data-id"), btn);
  });

  document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (me) {
        if (!me.loggedIn) {
          window.location.href = "/login";
          return;
        }
        return fetch("/api/favorites", { credentials: "same-origin" })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            renderFavorites(data.favorites || [], me.name);
          });
      })
      .catch(function () {
        document.getElementById("favoritesContainer").innerHTML =
          '<div class="dashboard-empty">Could not load your favorites. Please refresh the page.</div>';
      });
  });
})();
