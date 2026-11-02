(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Loader */
  const finishLoading = () => {
    body.classList.add("loaded");
    setTimeout(() => body.classList.remove("is-loading"), 600);
  };
  window.addEventListener("load", () => setTimeout(finishLoading, reduced ? 0 : 1300));
  setTimeout(finishLoading, 4000);

  $("#year").textContent = new Date().getFullYear();

  /* Header: scrolled state + hide on scroll down */
  const header = $(".header");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    header.classList.toggle("is-hidden", y > 400 && y > lastY && !body.classList.contains("menu-open"));
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const burger = $(".burger");
  const toggleMenu = (open = !body.classList.contains("menu-open")) => {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    $(".mobile-menu").setAttribute("aria-hidden", !open);
  };
  burger.addEventListener("click", () => toggleMenu());
  $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* Active nav link */
  const navLinks = $$(".nav a");
  const sectionObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${e.target.id}`));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("section[id]").forEach((s) => sectionObserver.observe(s));

  /* Reveal on scroll (with stagger for siblings) */
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealObserver.unobserve(e.target);
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => {
    const siblings = $$(":scope > .reveal", el.parentElement);
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", `${Math.min(i * 0.08, 0.5)}s`);
    revealObserver.observe(el);
  });

  /* Counters */
  const counterObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const dur = 1800;
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    }),
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => counterObserver.observe(el));

  /* Hero spotlight */
  const hero = $(".hero");
  if (finePointer) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
      hero.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  /* Card glow follows pointer */
  $$(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--cx", `${e.clientX - r.left}px`);
      card.style.setProperty("--cy", `${e.clientY - r.top}px`);
    });
  });

  /* Button fill origin + magnetic effect */
  $$(".btn").forEach((btn) => {
    btn.addEventListener("pointerenter", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--x", `${((e.clientX - r.left) / r.width) * 100}%`);
      btn.style.setProperty("--y", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
  if (finePointer && !reduced) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* Custom cursor */
  const cursor = $(".cursor");
  if (finePointer && !reduced) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add("is-active");
    });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("pointerover", (e) => {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, summary, .chips label, .work"));
    });
  }

  /* Parallax + process line (rAF throttled) */
  const parallaxEls = $$(".parallax");
  const steps = $(".steps");
  const stepEls = $$(".step");
  const line = $(".steps__line");
  let ticking = false;
  const update = () => {
    const vh = innerHeight;
    if (!reduced) {
      parallaxEls.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) * -(+el.dataset.speed || 0.1);
        const target = el.querySelector("img") || el;
        target.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    }
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.75 - r.top) / (r.height + vh * 0.25), 0), 1);
      line.style.setProperty("--p", p.toFixed(3));
      stepEls.forEach((s, i) => s.classList.toggle("is-on", p >= i / stepEls.length + 0.02 || s.getBoundingClientRect().top < vh * 0.6));
    }
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  addEventListener("resize", update);
  update();

  /* Accordion: only one open at a time + smooth height */
  const accs = $$(".acc");
  accs.forEach((acc) => {
    const summary = $("summary", acc);
    const content = $(".acc__body", acc);
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      const opening = !acc.open;
      accs.forEach((other) => { if (other !== acc && other.open) animateAcc(other, $(".acc__body", other), false); });
      animateAcc(acc, content, opening);
    });
  });
  function animateAcc(acc, content, open) {
    if (open) {
      acc.open = true;
      const h = content.scrollHeight;
      content.animate([{ height: "0px", opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" });
    } else {
      const h = content.scrollHeight;
      const anim = content.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 350, easing: "cubic-bezier(.22,1,.36,1)" });
      anim.onfinish = () => (acc.open = false);
    }
  }

  /* Contact form -> opens email client with a prefilled message */
  const form = $("#contactForm");
  const note = $(".form__note", form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    $$("[required]", form).forEach((f) => {
      const ok = f.value.trim() !== "";
      f.closest(".field").classList.toggle("is-error", !ok);
      if (!ok) valid = false;
    });
    if (!valid) { note.textContent = "فضلاً أكمل الحقول المطلوبة."; return; }
    const data = new FormData(form);
    const services = data.getAll("service").join("، ") || "غير محدد";
    const text = `الاسم: ${data.get("name")}\nالجوال: ${data.get("phone")}\nالبريد: ${data.get("email") || "-"}\nالخدمة: ${services}\n\n${data.get("message")}`;
    location.href = `mailto:info@impact.sa?subject=${encodeURIComponent("طلب مشروع جديد - " + data.get("name"))}&body=${encodeURIComponent(text)}`;
    note.textContent = "شكراً لك! سيتم فتح بريدك لإرسال الطلب.";
    form.reset();
  });
  $$(".field input, .field textarea", form).forEach((f) =>
    f.addEventListener("input", () => f.closest(".field").classList.remove("is-error"))
  );
})();
