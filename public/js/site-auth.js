(function () {
  "use strict";

  var currentUser = null; // { id, email, name } or null
  var favoriteIds = new Set(); // product ids the logged-in user has favorited

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  // ---------- Header state (account dropdown + logout) ----------
  function closeDropdown() {
    var dropdown = document.getElementById("accountDropdown");
    if (dropdown) dropdown.classList.remove("is-open");
  }

  function renderHeader() {
    var nameLabel = document.getElementById("accountNameLabel");
    var accountLink = qs(".account-icon-link");
    var wishlistCountEls = qsa(".wishlist-count");

    if (currentUser) {
      if (nameLabel) nameLabel.textContent = "Hi, " + currentUser.name;
      if (accountLink) accountLink.setAttribute("href", "/dashboard");
    } else {
      if (nameLabel) nameLabel.textContent = "";
      if (accountLink) accountLink.setAttribute("href", "/login");
      closeDropdown();
    }

    wishlistCountEls.forEach(function (el) {
      el.textContent = currentUser ? String(favoriteIds.size) : "0";
    });

    qsa(".wishlist-icon-link").forEach(function (el) {
      el.setAttribute("href", currentUser ? "/dashboard" : "/login");
    });
  }

  // Clicking the account icon: if logged in, open/close the dropdown instead of
  // navigating away. If logged out, let the link go to /login as normal.
  function wireAccountDropdown() {
    document.addEventListener("click", function (e) {
      var accountLink = e.target.closest ? e.target.closest(".account-icon-link") : null;
      var dropdown = document.getElementById("accountDropdown");

      if (accountLink) {
        if (currentUser) {
          e.preventDefault();
          if (dropdown) dropdown.classList.toggle("is-open");
        }
        return;
      }

      // Click outside the dropdown closes it
      if (dropdown && dropdown.classList.contains("is-open") && !dropdown.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  function refreshButtonState(btn) {
    var id = btn.getAttribute("data-id");
    var isFav = id && favoriteIds.has(id);
    btn.classList.toggle("is-favorited", !!isFav);
    var label = btn.querySelector("span");
    if (label && label.id === "productWishlistLabel") {
      label.textContent = isFav ? "Saved" : "Wishlist";
    }
  }

  function refreshAllFavButtons() {
    qsa(".fav-toggle-btn").forEach(refreshButtonState);
  }

  // ---------- Load current user + favorites ----------
  function loadMe() {
    return fetch("/api/auth/me", { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        currentUser = data.loggedIn ? { id: data.id, email: data.email, name: data.name } : null;
        if (currentUser) {
          return fetch("/api/favorites", { credentials: "same-origin" })
            .then(function (r) { return r.json(); })
            .then(function (data2) {
              favoriteIds = new Set((data2.favorites || []).map(function (f) { return f.product_id; }));
            })
            .catch(function () { favoriteIds = new Set(); });
        }
        favoriteIds = new Set();
      })
      .catch(function () {
        currentUser = null;
        favoriteIds = new Set();
      })
      .then(function () {
        renderHeader();
        refreshAllFavButtons();
      });
  }

  // ---------- Logout ----------
  function wireLogout() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("#logoutLink") : null;
      if (!link) return;
      e.preventDefault();
      fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
        .then(function () {
          currentUser = null;
          favoriteIds = new Set();
          closeDropdown();
          renderHeader();
          refreshAllFavButtons();
          if (window.location.pathname === "/dashboard") {
            window.location.href = "/";
          }
        });
    });
  }

  // ---------- Favorite / wishlist toggle buttons (delegated, since product cards render dynamically) ----------
  function wireFavToggle() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".fav-toggle-btn") : null;
      if (!btn) return;
      e.preventDefault();

      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      var id = btn.getAttribute("data-id");
      var name = btn.getAttribute("data-name") || "";
      var image = btn.getAttribute("data-image") || "";
      var slug = btn.getAttribute("data-slug") || "";
      if (!id) return;

      btn.disabled = true;
      fetch("/api/favorites/toggle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, name: name, image: image, slug: slug }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.favorited) {
            favoriteIds.add(id);
          } else {
            favoriteIds.delete(id);
          }
          renderHeader();
          refreshAllFavButtons();
        })
        .catch(function () {})
        .then(function () {
          btn.disabled = false;
        });
    });
  }

  // ---------- Newsletter form (footer, present on every page) ----------
  // NOTE: this form also has Webflow's own AJAX-form binding attached (from
  // webflow.js) which posts to a Webflow endpoint that doesn't exist for this
  // export, so it always shows its own "something went wrong" message. We
  // attach our handler on the CAPTURE phase and call stopImmediatePropagation
  // so ours runs first and Webflow's handler never fires at all.
  function wireNewsletterForm() {
    var form = document.getElementById("wf-form-Footer-Form-Two");
    if (!form) return;

    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        var input = document.getElementById("Footer-Email-2");
        var email = input ? input.value.trim() : "";
        var msg = document.getElementById("newsletterMsg");
        var submitBtn = form.querySelector('input[type="submit"]');

        if (!email) return;
        if (msg) {
          msg.textContent = "";
          msg.className = "newsletter-msg";
        }
        if (submitBtn) submitBtn.disabled = true;

        fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email }),
        })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
          .then(function (res) {
            if (res.ok) {
              if (msg) {
                msg.textContent = "Thank you! You're subscribed.";
                msg.className = "newsletter-msg is-success";
              }
              if (input) input.value = "";
            } else if (msg) {
              msg.textContent = res.data.error || "Something went wrong. Please try again.";
              msg.className = "newsletter-msg is-error";
            }
          })
          .catch(function () {
            if (msg) {
              msg.textContent = "Something went wrong. Please try again.";
              msg.className = "newsletter-msg is-error";
            }
          })
          .then(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      },
      true // capture phase - runs before Webflow's bubble-phase handler
    );
  }

  window.SkySuntonFavorites = { refreshButtonState: refreshButtonState };

  document.addEventListener("DOMContentLoaded", function () {
    wireLogout();
    wireFavToggle();
    wireNewsletterForm();
    wireAccountDropdown();
    loadMe();
  });
})();
