(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 全站 BGM：进入即尝试；多数浏览器需手势。滚轮也算交互（此前仅点击/按键，纯滚轮无法解锁会静音） */
  var bgm = document.getElementById("site-bgm");
  if (bgm) {
    bgm.volume = 0.32;
    function removeBgmUnlockListeners() {
      document.removeEventListener("pointerdown", tryPlayBgm);
      document.removeEventListener("keydown", tryPlayBgm);
      document.removeEventListener("wheel", tryPlayBgm);
      document.removeEventListener("touchstart", tryPlayBgm);
      document.removeEventListener("click", tryPlayBgm);
    }
    function tryPlayBgm() {
      if (!bgm.paused) {
        removeBgmUnlockListeners();
        return;
      }
      var p = bgm.play();
      if (p && typeof p.then === "function") {
        p.then(removeBgmUnlockListeners).catch(function () {});
      }
    }
    tryPlayBgm();
    document.addEventListener("pointerdown", tryPlayBgm, { passive: true });
    document.addEventListener("keydown", tryPlayBgm, { passive: true });
    document.addEventListener("wheel", tryPlayBgm, { passive: true });
    document.addEventListener("touchstart", tryPlayBgm, { passive: true });
    document.addEventListener("click", tryPlayBgm, { passive: true });
  }

  var iframe = document.getElementById("game-frame");
  var btnRemote = document.getElementById("btn-load-remote");
  var btnLocal = document.getElementById("btn-load-local");

  if (iframe && btnRemote && btnLocal) {
    var remote = iframe.getAttribute("data-remote");
    var local = iframe.getAttribute("data-local");
    btnRemote.addEventListener("click", function () {
      iframe.src = remote;
    });
    btnLocal.addEventListener("click", function () {
      iframe.src = local;
    });
  }

  /* ========== 全屏分页 + 滚轮阈值 ========== */
  var viewport = document.getElementById("page-viewport");
  var track = document.getElementById("page-track");
  var pages = document.querySelectorAll(".page");

  if (!reduceMotion && viewport && track && pages.length) {
    document.documentElement.classList.add("fullpage");
    var index = 0;
    var accum = 0;
    var THRESHOLD = 72;
    var MAX_DRAG = 118;
    var dragPx = 0;
    var dragRaf = 0;
    var dragTarget = 0;
    /** 与上一次 wheel 间隔小于此值视为「快速连滚」：不启用橡皮筋预览，翻页时无过渡拖延 */
    var WHEEL_FAST_GAP_MS = 95;
    var lastWheelAt = 0;
    function viewportH() {
      return viewport.clientHeight;
    }

    function layoutPages() {
      var h = viewportH();
      for (var i = 0; i < pages.length; i++) {
        pages[i].style.height = h + "px";
        pages[i].style.minHeight = h + "px";
      }
      track.style.height = h * pages.length + "px";
      applyTransform(false);
    }

    function applyTransform(noTransition) {
      var h = viewportH();
      var y = -index * h + dragPx;
      track.classList.toggle("is-dragging", !!noTransition);
      track.style.transform = "translate3d(0, " + y + "px, 0)";
    }

    function smoothDragFrame() {
      dragRaf = 0;
      dragPx += (dragTarget - dragPx) * 0.32;
      if (Math.abs(dragTarget - dragPx) < 0.35) {
        dragPx = dragTarget;
      }
      applyTransform(true);
      if (Math.abs(dragTarget - dragPx) > 0.4) {
        dragRaf = requestAnimationFrame(smoothDragFrame);
      }
    }

    function queueSmoothDrag() {
      if (!dragRaf) dragRaf = requestAnimationFrame(smoothDragFrame);
    }

    function snapToPage(instant) {
      if (dragRaf) {
        cancelAnimationFrame(dragRaf);
        dragRaf = 0;
      }
      accum = 0;
      dragPx = 0;
      dragTarget = 0;
      if (instant) {
        track.style.transition = "none";
      }
      applyTransform(false);
      if (instant) {
        void track.offsetWidth;
        requestAnimationFrame(function () {
          track.style.transition = "";
        });
      }
      updateDots();
      updateUrlHash();
    }

    function goToPage(i) {
      i = Math.max(0, Math.min(pages.length - 1, i));
      if (i !== index) {
        pages[i].scrollTop = 0;
      }
      index = i;
      snapToPage();
    }

    function updateDots() {
      var wrap = document.querySelector(".page-dots");
      if (!wrap) return;
      wrap.innerHTML = "";
      for (var d = 0; d < pages.length; d++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "page-dot" + (d === index ? " is-active" : "");
        dot.setAttribute("aria-label", "第 " + (d + 1) + " 屏");
        dot.dataset.page = String(d);
        wrap.appendChild(dot);
      }
      wrap.querySelectorAll(".page-dot").forEach(function (dot) {
        dot.addEventListener("click", function () {
          goToPage(parseInt(dot.dataset.page, 10));
        });
      });
    }

    function updateUrlHash() {
      var id = pages[index].id;
      if (id) history.replaceState(null, "", "#" + id);
    }

    function currentPageEl() {
      return pages[index];
    }

    function canScrollDown(el) {
      return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    }

    function canScrollUp(el) {
      return el.scrollTop > 2;
    }

    function onWheel(e) {
      var el = currentPageEl();
      var dy = e.deltaY;
      var now = Date.now();
      var isFastScroll = lastWheelAt > 0 && now - lastWheelAt < WHEEL_FAST_GAP_MS;
      lastWheelAt = now;

      if (dy > 0 && canScrollDown(el)) {
        el.scrollTop += dy;
        e.preventDefault();
        return;
      }
      if (dy < 0 && canScrollUp(el)) {
        el.scrollTop += dy;
        e.preventDefault();
        return;
      }

      e.preventDefault();
      accum += dy;

      if (isFastScroll) {
        dragTarget = 0;
        dragPx = 0;
        if (dragRaf) {
          cancelAnimationFrame(dragRaf);
          dragRaf = 0;
        }
        track.classList.remove("is-dragging");
        track.style.transition = "none";
        applyTransform(false);
        void track.offsetWidth;
        requestAnimationFrame(function () {
          track.style.transition = "";
        });
      } else {
        dragTarget = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, accum * 0.36));
        queueSmoothDrag();
      }

      if (Math.abs(accum) >= THRESHOLD) {
        if (accum > 0 && index < pages.length - 1) {
          index++;
        } else if (accum < 0 && index > 0) {
          index--;
        }
        accum = 0;
        dragTarget = 0;
        dragPx = 0;
        snapToPage(isFastScroll);
      }
    }

    var wheelEndTimer;
    function onWheelEnd() {
      clearTimeout(wheelEndTimer);
      wheelEndTimer = setTimeout(function () {
        if (Math.abs(accum) > 0 && Math.abs(accum) < THRESHOLD) {
          accum = 0;
          dragTarget = 0;
          dragPx = 0;
          snapToPage();
        }
      }, 260);
    }

    viewport.addEventListener(
      "wheel",
      function (e) {
        onWheel(e);
        onWheelEnd();
      },
      { passive: false }
    );

    window.addEventListener("resize", function () {
      layoutPages();
    });

    document.querySelectorAll("[data-page]").forEach(function (node) {
      node.addEventListener("click", function (e) {
        var pi = node.getAttribute("data-page");
        if (pi == null) return;
        e.preventDefault();
        goToPage(parseInt(pi, 10));
      });
    });

    layoutPages();
    updateDots();

    var hash = location.hash.replace(/^#/, "");
    if (hash) {
      pages.forEach(function (p, i) {
        if (p.id === hash) goToPage(i);
      });
    }

  } else if (reduceMotion) {
    document.body.classList.add("reduced-motion-fallback");
  }

  /* ========== 渐入（非首屏区块） ========== */
  if (!reduceMotion) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) en.target.classList.add("is-visible");
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.06 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      obs.observe(el);
    });
  }
})();
