(function () {
  "use strict";

  function setButtonLoading(btn, loading, loadingText, normalText) {
    btn.disabled = loading;
    btn.textContent = loading ? loadingText : normalText;
  }

  document.addEventListener("DOMContentLoaded", function () {
    // ---------- LOGIN ----------
    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
      var loginError = document.getElementById("loginError");
      var loginBtn = document.getElementById("loginSubmitBtn");

      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        loginError.classList.remove("is-visible");

        var email = document.getElementById("loginEmail").value.trim();
        var password = document.getElementById("loginPassword").value;

        setButtonLoading(loginBtn, true, "Logging in...", "Log In");

        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password: password }),
        })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
          .then(function (res) {
            if (res.ok) {
              window.location.href = "/dashboard";
            } else {
              loginError.textContent = res.data.error || "Could not log in.";
              loginError.classList.add("is-visible");
              setButtonLoading(loginBtn, false, "Logging in...", "Log In");
            }
          })
          .catch(function () {
            loginError.textContent = "Something went wrong. Please try again.";
            loginError.classList.add("is-visible");
            setButtonLoading(loginBtn, false, "Logging in...", "Log In");
          });
      });
    }

    // ---------- SIGNUP ----------
    var signupForm = document.getElementById("signupForm");
    if (signupForm) {
      var signupError = document.getElementById("signupError");
      var signupBtn = document.getElementById("signupSubmitBtn");

      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        signupError.classList.remove("is-visible");

        var email = document.getElementById("signupEmail").value.trim();
        var phone = document.getElementById("signupPhone").value.trim();
        var password = document.getElementById("signupPassword").value;

        setButtonLoading(signupBtn, true, "Creating account...", "Sign Up");

        fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, phone: phone, password: password }),
        })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
          .then(function (res) {
            if (res.ok) {
              window.location.href = "/dashboard";
            } else {
              signupError.textContent = res.data.error || "Could not create account.";
              signupError.classList.add("is-visible");
              setButtonLoading(signupBtn, false, "Creating account...", "Sign Up");
            }
          })
          .catch(function () {
            signupError.textContent = "Something went wrong. Please try again.";
            signupError.classList.add("is-visible");
            setButtonLoading(signupBtn, false, "Creating account...", "Sign Up");
          });
      });
    }
  });
})();
