/* 농사남 아카이브 — interactions */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: transparent over hero → solid; hide on scroll down ---------- */
  var header = document.querySelector("[data-header]");
  var hero = document.querySelector(".hero");
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var heroEnd = hero ? hero.offsetHeight - header.offsetHeight : 0;
    header.classList.toggle("is-solid", y > heroEnd - 1);

    var menuOpen = document.body.classList.contains("menu-open");
    if (!menuOpen && y > heroEnd + 200 && y > lastY + 4) header.classList.add("is-hidden");
    else if (y < lastY - 4 || y <= heroEnd) header.classList.remove("is-hidden");
    lastY = y;

    // Gentle parallax on hero image
    if (!reduceMotion && hero && y < hero.offsetHeight) {
      var media = hero.querySelector("[data-parallax]");
      if (media) media.style.transform = "translate3d(0," + y * 0.25 + "px,0)";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-nav]");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    if (open) header.classList.remove("is-hidden");
  }
  toggle.addEventListener("click", function () {
    setMenu(!document.body.classList.contains("menu-open"));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- Viewfinder timecode (HH:MM:SS:FF @ 25fps) ---------- */
  var tc = document.querySelector("[data-timecode]");
  if (tc) {
    var start = performance.now();
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    var lastFrame = -1;
    (function tick(now) {
      var totalFrames = Math.floor(((now - start) / 1000) * 25);
      if (totalFrames !== lastFrame) {
        lastFrame = totalFrames;
        var f = totalFrames % 25;
        var s = Math.floor(totalFrames / 25);
        tc.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(f);
      }
      requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = [].slice.call(document.querySelectorAll("[data-reveal]"));

  // Stagger siblings that reveal together
  revealEls.forEach(function (el) {
    var siblings = [].filter.call(el.parentElement.children, function (c) { return c.hasAttribute("data-reveal"); });
    var i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.08, 0.4) + "s");
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.hasAttribute("data-colorize")) entry.target.classList.add("is-colored");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
      if (el.hasAttribute("data-colorize")) el.classList.add("is-colored");
    });
  }

  /* ---------- Video inline player on click ---------- */
  var videoMediaEls = document.querySelectorAll(".video-media[data-yt-id]");
  videoMediaEls.forEach(function (el) {
    el.addEventListener("click", function () {
      var ytId = el.getAttribute("data-yt-id");
      if (!ytId) return;
      var iframe = document.createElement("iframe");
      iframe.setAttribute("src", "https://www.youtube-nocookie.com/embed/" + ytId + "?autoplay=1&rel=0");
      iframe.setAttribute("title", "YouTube video player");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "true");
      el.innerHTML = "";
      el.appendChild(iframe);
      el.style.cursor = "default";
    });
  });

  /* ---------- Contact form → mailto ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var note = form.querySelector("[data-form-note]");
    var defaultNote = note.textContent;
    var TO = "Nongsanam.korea@gmail.com";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var required = ["name", "reach", "message"];
      var firstInvalid = null;

      required.forEach(function (key) {
        var input = form.elements[key];
        var ok = String(data.get(key) || "").trim().length > 0;
        input.closest(".field").classList.toggle("is-invalid", !ok);
        if (!ok && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        note.textContent = "필수 항목을 입력해 주세요.";
        note.classList.add("is-error");
        firstInvalid.focus();
        return;
      }

      note.textContent = defaultNote;
      note.classList.remove("is-error");

      var type = data.get("type");
      var subject = "[농사남 아카이브 문의] " + type + " — " + data.get("name");
      var body = [
        "이름/단체명: " + data.get("name"),
        "연락처: " + data.get("reach"),
        "문의 유형: " + type,
        "일정/장소: " + (data.get("when") || "-"),
        "",
        String(data.get("message"))
      ].join("\n");

      window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });

    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field");
      if (field && field.classList.contains("is-invalid") && e.target.value.trim()) field.classList.remove("is-invalid");
    });
  }

  /* ---------- Footer wordmark: fit to container width ---------- */
  var word = document.querySelector(".footer-word");
  function fitWord() {
    if (!word) return;
    word.style.fontSize = "100px";
    var ratio = word.parentElement.clientWidth / word.offsetWidth;
    word.style.fontSize = Math.floor(100 * ratio * 0.995) + "px";
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);
  fitWord();
  window.addEventListener("resize", fitWord);

  /* ---------- Year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
