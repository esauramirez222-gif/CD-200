/* =========================================================
   Club Deportivo 2000 · Interacciones
   ========================================================= */

/* ---------- Configuración editable ---------- */
const CONFIG = {
    // Número de WhatsApp del club (formato internacional, solo dígitos).
    // POR CONFIRMAR con el cliente: se usa el teléfono principal como provisional.
    whatsapp: "524448152000",

    // Horario por día (0 = domingo … 6 = sábado). null = cerrado.
    // POR CONFIRMAR: el lunes no aparece en las fuentes públicas.
    schedule: {
        0: ["07:30", "19:30"],
        1: ["06:00", "22:00"],
        2: ["06:00", "22:00"],
        3: ["06:00", "22:00"],
        4: ["06:00", "22:00"],
        5: ["06:00", "22:00"],
        6: ["06:00", "22:00"],
    },
    timeZone: "America/Mexico_City",
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Secuencia de entrada ---------- */
function startIntro() {
    requestAnimationFrame(() => document.documentElement.classList.add("is-loaded"));
}

/* ---------- Encabezado al hacer scroll + barra móvil ---------- */
function initScrollState() {
    const header = document.querySelector(".site-header");
    const bar = document.getElementById("action-bar");
    const hero = document.getElementById("inicio");
    const barLinks = bar ? bar.querySelectorAll("a") : [];
    let ticking = false;

    const update = () => {
        const y = window.scrollY;
        header.classList.toggle("is-scrolled", y > 12);

        if (bar && hero) {
            const contact = document.getElementById("contacto");
            const pastHero = y > hero.offsetHeight * 0.75;
            const atContact = contact && contact.getBoundingClientRect().top < window.innerHeight * 0.6;
            const show = pastHero && !atContact && !document.body.classList.contains("menu-open");
            bar.classList.toggle("is-visible", show);
            bar.setAttribute("aria-hidden", String(!show));
            barLinks.forEach((a) => (a.tabIndex = show ? 0 : -1));
        }
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
    update();
}

/* ---------- Menú móvil ---------- */
function initMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("main-nav");
    if (!toggle || !nav) return;
    const label = toggle.querySelector(".visually-hidden");
    const mq = window.matchMedia("(max-width: 960px)");

    const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        nav.classList.toggle("is-open", open);
        document.body.classList.toggle("menu-open", open);
        if (label) label.textContent = open ? "Cerrar menú" : "Abrir menú";
        if (open) {
            const first = nav.querySelector("a");
            setTimeout(() => first && first.focus({ preventScroll: true }), 250);
        }
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

    nav.addEventListener("click", (e) => {
        if (e.target.closest("a") && mq.matches) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && nav.classList.contains("is-open")) {
            setOpen(false);
            toggle.focus();
        }
        // Mantener el foco dentro del menú abierto
        if (e.key === "Tab" && nav.classList.contains("is-open")) {
            const focusables = [toggle, ...nav.querySelectorAll("a")];
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    mq.addEventListener("change", (e) => { if (!e.matches) setOpen(false); });
}

/* ---------- Enlace activo en el menú ---------- */
function initActiveNav() {
    const links = [...document.querySelectorAll(".main-nav__list a")];
    const sections = links
        .map((a) => document.querySelector(a.getAttribute("href")))
        .filter(Boolean);
    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                links.forEach((a) => {
                    const active = a.getAttribute("href") === "#" + entry.target.id;
                    a.classList.toggle("is-active", active);
                    if (active) a.setAttribute("aria-current", "true");
                    else a.removeAttribute("aria-current");
                });
            }
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((s) => io.observe(s));
}

/* ---------- Revelado al hacer scroll ---------- */
function initReveal() {
    const items = document.querySelectorAll(".reveal, [data-observe]");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        items.forEach((el) => el.classList.add("is-visible", "is-done"));
        return;
    }

    // Escalonar elementos hermanos (mosaico y carriles)
    document.querySelectorAll(".mosaic, .lanes").forEach((group) => {
        [...group.children].forEach((child, i) => child.style.setProperty("--delay", `${Math.min(i * 0.09, 0.5)}s`));
    });

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add("is-visible");
            obs.unobserve(el);
            // Quitar retrasos cuando termina la entrada (para que el hover sea inmediato)
            const delay = parseFloat(getComputedStyle(el).getPropertyValue("--delay")) || 0;
            setTimeout(() => el.classList.add("is-done"), (delay + 1.6) * 1000);
            el.querySelectorAll(".count").forEach(countUp);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach((el) => io.observe(el));
}

/* ---------- Números que cuentan hacia arriba ---------- */
function prepareCounters() {
    if (prefersReducedMotion) return;
    document.querySelectorAll(".count").forEach((el) => {
        el.dataset.final = el.textContent;
        // Reservar el ancho final para que nada brinque mientras cuenta
        el.style.display = "inline-block";
        el.style.minWidth = `${el.getBoundingClientRect().width}px`;
        el.textContent = "0";
    });
}
function countUp(el) {
    if (prefersReducedMotion || el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = Number(el.dataset.count);
    const fmt = new Intl.NumberFormat("es-MX");
    const duration = 1400;
    const start = performance.now() + 250;
    const tick = (now) => {
        const t = Math.min(Math.max((now - start) / duration, 0), 1);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = fmt.format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = el.dataset.final || fmt.format(target);
    };
    requestAnimationFrame(tick);
}

/* ---------- Ilustraciones que se dibujan ---------- */
function prepareLineArt() {
    document.querySelectorAll(".tile__art g > *").forEach((shape) => {
        if (shape.getAttribute("fill") !== "currentColor") shape.setAttribute("pathLength", "1");
    });
    if (prefersReducedMotion) {
        document.querySelectorAll(".tile__art").forEach((svg) => svg.pauseAnimations && svg.pauseAnimations());
    }
}

/* ---------- Inclinación 3D con brillo ---------- */
function initTilt() {
    if (prefersReducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const MAX = 7; // grados
    document.querySelectorAll(".tilt").forEach((el) => {
        let frame = null;
        el.addEventListener("pointermove", (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                el.classList.add("is-tilting");
                el.style.setProperty("--ry", `${(px - 0.5) * MAX * 2}deg`);
                el.style.setProperty("--rx", `${(0.5 - py) * MAX * 2}deg`);
                el.style.setProperty("--gx", `${px * 100}%`);
                el.style.setProperty("--gy", `${py * 100}%`);
            });
        });
        el.addEventListener("pointerleave", () => {
            cancelAnimationFrame(frame);
            el.classList.remove("is-tilting");
            el.style.setProperty("--rx", "0deg");
            el.style.setProperty("--ry", "0deg");
        });
    });
}

/* ---------- Parallax y barra de progreso ---------- */
function initScrollEffects() {
    const bar = document.querySelector(".scroll-progress");
    const layers = [
        { el: document.querySelector(".hero__photo"), speed: 0.25 },
        ...[...document.querySelectorAll(".camp__media img, .events__media img")].map((el) => ({ el, speed: 0.12 })),
    ].filter((l) => l.el);
    let ticking = false;

    const update = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        if (bar) bar.style.setProperty("--progress", max > 0 ? (window.scrollY / max).toFixed(4) : 0);

        if (!prefersReducedMotion) {
            const vh = window.innerHeight;
            layers.forEach(({ el, speed }) => {
                const box = el.parentElement.getBoundingClientRect();
                if (box.bottom < -100 || box.top > vh + 100) return;
                const scale = parseFloat(getComputedStyle(el).scale) || 1;
                const room = Math.max(0, (box.height * (scale - 1)) / 2 - 4);
                const raw = (box.top + box.height / 2 - vh / 2) * -speed;
                const offset = Math.max(-room, Math.min(room, raw));
                el.style.setProperty("--py", `${offset.toFixed(1)}px`);
            });
        }
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
}

/* ---------- Burbujas ---------- */
function initBubbles() {
    if (prefersReducedMotion) return;
    document.querySelectorAll(".bubbles").forEach((box) => {
        const amount = box.classList.contains("bubbles--pool") ? 18 : 14;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < amount; i++) {
            const b = document.createElement("span");
            const size = 4 + Math.random() * 14;
            b.style.setProperty("--x", `${Math.random() * 100}%`);
            b.style.setProperty("--s", `${size.toFixed(1)}px`);
            b.style.setProperty("--d", `${(7 + Math.random() * 8).toFixed(1)}s`);
            b.style.setProperty("--delay", `${(Math.random() * -14).toFixed(1)}s`);
            b.style.setProperty("--sway", `${(Math.random() * 40 - 20).toFixed(0)}px`);
            frag.appendChild(b);
        }
        box.appendChild(frag);
    });
}

/* ---------- Imágenes: aparecer suave y respaldo si fallan ----------
   1) Foto local (assets/fotos/…).
   2) Copia pública en Google Drive (data-drive), por dos rutas distintas.
   3) Si nada carga, queda el fondo de agua definido en el CSS. */
function initImages() {
    const sources = [
        (id) => `https://lh3.googleusercontent.com/d/${id}=w2000`,
        (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    ];

    document.querySelectorAll(".js-img").forEach((img) => {
        let step = 0;
        const ready = () => img.classList.add("is-ready");
        const fail = () => {
            if (img.dataset.drive && step < sources.length) {
                img.addEventListener("load", ready, { once: true });
                img.addEventListener("error", fail, { once: true });
                img.src = sources[step++](img.dataset.drive);
            } else {
                img.classList.add("is-broken");
            }
        };

        if (img.complete) {
            img.naturalWidth > 0 ? ready() : fail();
        } else {
            img.addEventListener("load", ready, { once: true });
            img.addEventListener("error", fail, { once: true });
        }
    });
}

/* ---------- Acordeones ---------- */
function initAccordions() {
    document.querySelectorAll(".accordion__trigger").forEach((btn) => {
        const panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (!panel) return;
        panel.inert = true;
        btn.addEventListener("click", () => {
            const open = btn.getAttribute("aria-expanded") !== "true";
            btn.setAttribute("aria-expanded", String(open));
            panel.classList.toggle("is-open", open);
            panel.inert = !open;
        });
    });
}

/* ---------- Horario: abierto / cerrado ahora ---------- */
function initOpenStatus() {
    const el = document.getElementById("open-status");
    if (!el) return;
    const text = el.querySelector(".today-card__status-text");

    const toMinutes = (hhmm) => {
        const [h, m] = hhmm.split(":").map(Number);
        return h * 60 + m;
    };
    const fmt = (hhmm) => hhmm.replace(/^0/, "");
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

    const nowInMexico = () => {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: CONFIG.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
        }).formatToParts(new Date());
        const get = (t) => parts.find((p) => p.type === t).value;
        const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        return { day: map[get("weekday")], minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
    };

    const render = () => {
        const { day, minutes } = nowInMexico();
        const today = CONFIG.schedule[day];
        el.classList.remove("is-open", "is-closed");

        if (today && minutes >= toMinutes(today[0]) && minutes < toMinutes(today[1])) {
            el.classList.add("is-open");
            text.textContent = `Abierto ahora, hasta las ${fmt(today[1])}`;
            return;
        }

        el.classList.add("is-closed");
        if (today && minutes < toMinutes(today[0])) {
            text.textContent = `Cerrado. Abre hoy a las ${fmt(today[0])}`;
            return;
        }
        for (let i = 1; i <= 7; i++) {
            const d = (day + i) % 7;
            const next = CONFIG.schedule[d];
            if (next) {
                const when = i === 1 ? "mañana" : `el ${days[d]}`;
                text.textContent = `Cerrado. Abre ${when} a las ${fmt(next[0])}`;
                return;
            }
        }
        text.textContent = "Consulta el horario por teléfono";
    };

    render();
    setInterval(render, 60 * 1000);
}

/* ---------- Botones que preseleccionan el interés ---------- */
function initPlanLinks() {
    const select = document.getElementById("f-interest");
    if (!select) return;
    document.querySelectorAll("[data-plan]").forEach((link) => {
        link.addEventListener("click", () => {
            const plan = link.dataset.plan;
            const option = [...select.options].find((o) => o.text === plan);
            if (option) select.value = option.value;
            // Llevar el foco al formulario tras el desplazamiento
            setTimeout(() => {
                const name = document.getElementById("f-name");
                name && name.focus({ preventScroll: true });
            }, prefersReducedMotion ? 0 : 700);
        });
    });
}

/* ---------- Formulario → WhatsApp ---------- */
function initForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const status = document.getElementById("form-status");

    const fields = {
        name: { el: form.elements.name, check: (v) => (v.trim().length >= 2 ? "" : "Escribe tu nombre para saber cómo dirigirnos a ti.") },
        phone: {
            el: form.elements.phone,
            check: (v) => (v.replace(/\D/g, "").length >= 10 ? "" : "Escribe un teléfono de 10 dígitos, por ejemplo 444 123 4567."),
        },
    };

    const showError = (key, msg) => {
        const field = fields[key].el.closest(".field");
        const err = field.querySelector(".field__error");
        field.classList.toggle("has-error", Boolean(msg));
        fields[key].el.setAttribute("aria-invalid", msg ? "true" : "false");
        err.textContent = msg;
    };

    Object.keys(fields).forEach((key) => {
        fields[key].el.addEventListener("blur", () => {
            if (fields[key].el.value) showError(key, fields[key].check(fields[key].el.value));
        });
        fields[key].el.addEventListener("input", () => {
            if (fields[key].el.closest(".field").classList.contains("has-error")) {
                showError(key, fields[key].check(fields[key].el.value));
            }
        });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let firstInvalid = null;
        Object.keys(fields).forEach((key) => {
            const msg = fields[key].check(fields[key].el.value);
            showError(key, msg);
            if (msg && !firstInvalid) firstInvalid = fields[key].el;
        });
        if (firstInvalid) {
            firstInvalid.focus();
            status.textContent = "";
            return;
        }

        const name = form.elements.name.value.trim();
        const phone = form.elements.phone.value.trim();
        const interest = form.elements.interest.value;
        const message = form.elements.message.value.trim();

        const text = [
            `Hola, soy ${name}.`,
            `Me interesa: ${interest}.`,
            message ? message : null,
            `Mi teléfono: ${phone}`,
        ].filter(Boolean).join("\n");

        const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank", "noopener");
        status.textContent = "Abrimos WhatsApp con tu mensaje listo. Solo presiona enviar.";
    });
}

/* ---------- Año del pie ---------- */
function initYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
}

/* ---------- Arranque ---------- */
document.addEventListener("DOMContentLoaded", () => {
    initImages();
    prepareCounters();
    prepareLineArt();
    initBubbles();
    initScrollState();
    initScrollEffects();
    initTilt();
    initMobileNav();
    initActiveNav();
    initReveal();
    initAccordions();
    initOpenStatus();
    initPlanLinks();
    initForm();
    initYear();
    startIntro();
});