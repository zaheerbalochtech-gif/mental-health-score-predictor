/* ==========================================================================
   Mindscope AI — Mental Health Score Prediction
   Vanilla JS: form handling, sliders, validation, API call, result animation
   ========================================================================== */

(function () {
  "use strict";

  // ==========================================================================
  // API Configuration
  // Local Dev: "http://127.0.0.1:7860" or "http://127.0.0.1:2200"
  // Production Backend: Railway
  // ==========================================================================
  const API_BASE = window.API_BASE_URL || (
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:7860"
      : "https://mental-health-score-predictor-production.up.railway.app"
  );
  const PREDICT_ENDPOINT = `${API_BASE}/predict`;

  /* ------------------------------------------------------------------ */
  /* Theme toggle (in-memory only — no browser storage)                 */
  /* ------------------------------------------------------------------ */
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
  });

  /* ------------------------------------------------------------------ */
  /* Button ripple animation (reusable for any .btn-primary / .btn-ghost)*/
  /* ------------------------------------------------------------------ */
  function attachRipple(el) {
    el.addEventListener("click", function (e) {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  }
  document.querySelectorAll(".btn-primary, .btn-ghost").forEach((el) => {
    el.classList.add("ripple-host");
    attachRipple(el);
  });

  /* ------------------------------------------------------------------ */
  /* Mobile navbar burger                                                */
  /* ------------------------------------------------------------------ */
  const navBurger = document.getElementById("navBurger");
  const navbarLinks = document.getElementById("navbarLinks");
  navBurger.addEventListener("click", () => {
    navbarLinks.classList.toggle("open");
  });
  navbarLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navbarLinks.classList.remove("open"));
  });

  /* ------------------------------------------------------------------ */
  /* Floating labels for <select> elements                               */
  /* (native :not(:placeholder-shown) doesn't apply to selects, so we    */
  /*  toggle a class manually whenever a valid option is chosen)         */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll(".floating-field select").forEach((select) => {
    const field = select.closest(".field");
    const sync = () => field.classList.toggle("has-value", select.value !== "");
    select.addEventListener("change", sync);
    sync();
  });

  /* ------------------------------------------------------------------ */
  /* Searchable country dropdown                                         */
  /* ------------------------------------------------------------------ */
  // Backend's top_countries list, shown first since the model was primarily
  // trained on these; "country" itself is a free string field so any value
  // typed and confirmed by the user is accepted.
  const TOP_COUNTRIES = [
    "India", "USA", "Canada", "Australia", "UK", "Germany", "Mexico", "Turkey", "France", "Other"
  ];

  const OTHER_COUNTRIES = [
    "Afghanistan","Argentina","Austria","Bangladesh","Belgium","Brazil",
    "Chile","China","Colombia","Denmark","Egypt","Finland",
    "Ghana","Greece","Indonesia","Iran","Iraq","Ireland","Israel",
    "Italy","Japan","Jordan","Kenya","Malaysia","Morocco","Netherlands",
    "New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland",
    "Portugal","Russia","Saudi Arabia","Singapore","South Africa","South Korea",
    "Spain","Sri Lanka","Sweden","Switzerland","Thailand","UAE",
    "Ukraine","Vietnam"
  ];

  const COUNTRIES = [...TOP_COUNTRIES, ...OTHER_COUNTRIES];

  const countrySearch = document.getElementById("countrySearch");
  const countryHidden = document.getElementById("country");
  const countryDropdown = document.getElementById("countryDropdown");
  const countryField = document.getElementById("countryField");

  function renderCountryOptions(filter) {
    const term = filter.trim().toLowerCase();
    const matches = term
      ? COUNTRIES.filter((c) => c.toLowerCase().includes(term))
      : COUNTRIES;

    countryDropdown.innerHTML = "";

    if (matches.length === 0) {
      const li = document.createElement("li");
      li.className = "no-match";
      li.textContent = "No matching country";
      countryDropdown.appendChild(li);
      return;
    }

    matches.slice(0, 40).forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c;
      li.setAttribute("role", "option");
      li.addEventListener("mousedown", (e) => {
        // mousedown fires before blur, so selection registers reliably
        e.preventDefault();
        selectCountry(c);
      });
      countryDropdown.appendChild(li);
    });
  }

  function selectCountry(name) {
    countrySearch.value = name;
    countryHidden.value = name;
    countryField.classList.add("has-value");
    countryDropdown.classList.remove("open");
    clearFieldError("country");
  }

  countrySearch.addEventListener("focus", () => {
    renderCountryOptions(countrySearch.value);
    countryDropdown.classList.add("open");
  });
  countrySearch.addEventListener("input", () => {
    countryHidden.value = ""; // require an explicit selection from the list
    renderCountryOptions(countrySearch.value);
    countryDropdown.classList.add("open");
  });
  countrySearch.addEventListener("blur", () => {
    // slight delay so a click on a list item can still register
    setTimeout(() => countryDropdown.classList.remove("open"), 120);
  });
  document.addEventListener("click", (e) => {
    if (!countryField.contains(e.target)) countryDropdown.classList.remove("open");
  });

  /* ------------------------------------------------------------------ */
  /* Sliders: sync range <-> number/readout, and fill percentage        */
  /* ------------------------------------------------------------------ */
  function wireSlider(rangeId, opts) {
    const range = document.getElementById(rangeId);
    if (!range) return;
    const min = parseFloat(range.min);
    const max = parseFloat(range.max);

    function updateFill() {
      const pct = ((parseFloat(range.value) - min) / (max - min)) * 100;
      range.style.setProperty("--fill", `${pct}%`);
    }

    function updateReadout() {
      if (opts.numberInput) {
        opts.numberInput.value = range.value;
      }
      if (opts.readoutEl) {
        opts.readoutEl.textContent = range.value;
      }
    }

    range.addEventListener("input", () => {
      updateFill();
      updateReadout();
      clearFieldError(opts.errorKey);
    });

    if (opts.numberInput) {
      opts.numberInput.addEventListener("input", () => {
        let v = parseFloat(opts.numberInput.value);
        if (isNaN(v)) return;
        v = Math.min(max, Math.max(min, v));
        range.value = v;
        updateFill();
        clearFieldError(opts.errorKey);
      });
    }

    updateFill();
    updateReadout();
  }

  wireSlider("avg_daily_usage_hours", {
    numberInput: document.getElementById("avg_daily_usage_hours_num"),
    errorKey: "avg_daily_usage_hours",
  });
  wireSlider("study_hours", { readoutEl: document.getElementById("study_hours_readout") });
  wireSlider("physical_activity_hours", { readoutEl: document.getElementById("physical_activity_hours_readout") });
  wireSlider("sleep_hours_per_night", { readoutEl: document.getElementById("sleep_hours_per_night_readout") });

  /* ------------------------------------------------------------------ */
  /* Field-level error helpers                                           */
  /* ------------------------------------------------------------------ */
  function setFieldError(key, message) {
    const errEl = document.querySelector(`.field-error[data-for="${key}"]`);
    if (errEl) errEl.textContent = message;
    const input = document.getElementById(key) || document.getElementById(`${key}Search`);
    const field = input ? input.closest(".field") : null;
    if (field) field.classList.add("invalid");
  }

  function clearFieldError(key) {
    if (!key) return;
    const errEl = document.querySelector(`.field-error[data-for="${key}"]`);
    if (errEl) errEl.textContent = "";
    const input = document.getElementById(key) || document.getElementById(`${key}Search`);
    const field = input ? input.closest(".field") : null;
    if (field) field.classList.remove("invalid");
  }

  function clearAllErrors() {
    document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
    document.querySelectorAll(".field.invalid").forEach((el) => el.classList.remove("invalid"));
  }

  /* ------------------------------------------------------------------ */
  /* Validation                                                          */
  /* ------------------------------------------------------------------ */
  function validateForm(payload) {
    let valid = true;

    if (!Number.isInteger(payload.age) || payload.age < 10 || payload.age > 100) {
      setFieldError("age", "Enter an age between 10 and 100.");
      valid = false;
    }
    if (!payload.gender) {
      setFieldError("gender", "Please select a gender.");
      valid = false;
    }
    if (!payload.country) {
      setFieldError("country", "Please choose a country from the list.");
      valid = false;
    }
    if (!payload.academic_level) {
      setFieldError("academic_level", "Please select an academic level.");
      valid = false;
    }
    if (!payload.most_used_platform) {
      setFieldError("most_used_platform", "Please select a platform.");
      valid = false;
    }
    if (!payload.purpose_of_use) {
      setFieldError("purpose_of_use", "Please select a purpose.");
      valid = false;
    }
    if (isNaN(payload.avg_daily_usage_hours) || payload.avg_daily_usage_hours < 6 || payload.avg_daily_usage_hours > 24) {
      setFieldError("avg_daily_usage_hours", "Value must be between 6 and 24 hours.");
      valid = false;
    }
    if (!Number.isFinite(payload.daily_unlocks) || payload.daily_unlocks < 0) {
      setFieldError("daily_unlocks", "Enter a valid, non-negative number.");
      valid = false;
    }
    if (isNaN(payload.study_hours) || payload.study_hours < 0 || payload.study_hours > 24) {
      valid = false;
    }
    if (isNaN(payload.physical_activity_hours) || payload.physical_activity_hours < 0 || payload.physical_activity_hours > 2) {
      valid = false;
    }
    if (isNaN(payload.sleep_hours_per_night) || payload.sleep_hours_per_night < 0 || payload.sleep_hours_per_night > 24) {
      valid = false;
    }
    if (!payload.stress_level) {
      setFieldError("stress_level", "Please select a stress level.");
      valid = false;
    }

    return valid;
  }

  /* ------------------------------------------------------------------ */
  /* Error toast                                                          */
  /* ------------------------------------------------------------------ */
  const errorToast = document.getElementById("errorToast");
  const errorToastMessage = document.getElementById("errorToastMessage");
  const errorToastClose = document.getElementById("errorToastClose");
  let toastTimer = null;

  function showErrorToast(message) {
    errorToastMessage.textContent = message;
    errorToast.hidden = false;
    // allow the browser to paint hidden->block before animating in
    requestAnimationFrame(() => errorToast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideErrorToast, 6000);
  }

  function hideErrorToast() {
    errorToast.classList.remove("show");
    setTimeout(() => {
      errorToast.hidden = true;
    }, 350);
  }

  errorToastClose.addEventListener("click", hideErrorToast);

  /* ------------------------------------------------------------------ */
  /* Result rendering                                                     */
  /* ------------------------------------------------------------------ */
  const resultCard = document.getElementById("resultCard");
  const scoreNumberEl = document.getElementById("scoreNumber");
  const ringFill = document.getElementById("ringFill");
  const progressBarFill = document.getElementById("progressBarFill");
  const resultCaption = document.getElementById("resultCaption");

  const RING_CIRCUMFERENCE = 540.35; // 2 * PI * 86

  function scoreCaption(score) {
    if (score >= 80) return "Strong indicators of positive mental well‑being.";
    if (score >= 60) return "Generally stable, with some areas to keep an eye on.";
    if (score >= 40) return "Moderate risk — a few habits may be worth adjusting.";
    return "Elevated risk indicators — consider speaking with someone you trust.";
  }

  function scoreColor(score) {
    if (score >= 80) return "#31E1E8"; // cyan
    if (score >= 60) return "#5B8DFF"; // blue
    if (score >= 40) return "#9B6BFF"; // purple
    return "#FF8FA3"; // warm red
  }

  function animateCounter(el, target, duration) {
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = start + (target - start) * eased;
      el.textContent = value.toFixed(1);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(1);
    }
    requestAnimationFrame(tick);
  }

  function showResult(score) {
    const clamped = Math.max(0, Math.min(100, score));
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: "smooth", block: "center" });

    resultCaption.textContent = scoreCaption(clamped);
    const color = scoreColor(clamped);

    // Circular progress
    const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;
    ringFill.style.stroke = color;
    // reset then animate
    ringFill.style.transition = "none";
    ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE;
    // force reflow
    void ringFill.getBoundingClientRect();
    ringFill.style.transition = "";
    requestAnimationFrame(() => {
      ringFill.style.strokeDashoffset = offset;
    });

    // Progress bar
    progressBarFill.style.width = "0%";
    requestAnimationFrame(() => {
      progressBarFill.style.width = `${clamped}%`;
    });

    // Animated counter
    animateCounter(scoreNumberEl, clamped, 1200);
  }

  /* ------------------------------------------------------------------ */
  /* Form submission                                                      */
  /* ------------------------------------------------------------------ */
  const form = document.getElementById("predictForm");
  const predictBtn = document.getElementById("predictBtn");

  function collectPayload() {
    return {
      age: parseInt(document.getElementById("age").value, 10),
      gender: document.getElementById("gender").value,
      country: countryHidden.value,
      academic_level: document.getElementById("academic_level").value,
      most_used_platform: document.getElementById("most_used_platform").value,
      purpose_of_use: document.getElementById("purpose_of_use").value,
      avg_daily_usage_hours: parseFloat(document.getElementById("avg_daily_usage_hours").value),
      daily_unlocks: parseInt(document.getElementById("daily_unlocks").value, 10),
      study_hours: parseFloat(document.getElementById("study_hours").value),
      physical_activity_hours: parseFloat(document.getElementById("physical_activity_hours").value),
      sleep_hours_per_night: parseFloat(document.getElementById("sleep_hours_per_night").value),
      stress_level: document.getElementById("stress_level").value,
    };
  }

  function setLoading(isLoading) {
    predictBtn.disabled = isLoading;
    predictBtn.classList.toggle("loading", isLoading);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();

    const payload = collectPayload();

    if (!validateForm(payload)) {
      showErrorToast("Please fix the highlighted fields before predicting.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(PREDICT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let detail = `Server responded with status ${response.status}.`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.detail) {
            detail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch (_) {
          /* ignore parse errors on error body */
        }
        throw new Error(detail);
      }

      const data = await response.json();
      const score = Number(data.predicted_mental_health_score);

      if (Number.isNaN(score)) {
        throw new Error("The server returned an unexpected response format.");
      }

      showResult(score);
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Couldn't reach the prediction server. Make sure it's running at " + API_BASE + "."
          : err.message || "Something went wrong while predicting your score.";
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  });

  /* ------------------------------------------------------------------ */
  /* Reset form                                                           */
  /* ------------------------------------------------------------------ */
  const resetBtn = document.getElementById("resetBtn");
  resetBtn.addEventListener("click", () => {
    form.reset();
    clearAllErrors();

    // Reset country search field
    countrySearch.value = "";
    countryHidden.value = "";
    countryField.classList.remove("has-value");

    // Reset selects' floating label state
    document.querySelectorAll(".floating-field select").forEach((select) => {
      select.closest(".field").classList.remove("has-value");
    });

    // Reset sliders to their defaults & fill visuals
    const sliderDefaults = {
      avg_daily_usage_hours: 6,
      study_hours: 0,
      physical_activity_hours: 0,
      sleep_hours_per_night: 0,
    };
    Object.entries(sliderDefaults).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event("input"));
      }
    });
    document.getElementById("avg_daily_usage_hours_num").value = 6;

    // Hide result card
    resultCard.hidden = true;
  });
})();
