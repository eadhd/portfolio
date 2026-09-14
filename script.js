/* ==========================================================================
   ISI PORTFOLIO — datanya ada di profile.json (satu file itu saja yang
   biasanya perlu kamu edit). File ini hanya membaca dan menampilkannya,
   plus menjalankan boot animation, navigasi aktif, dan chatbot AI.
   ========================================================================== */
let profile = null;

/* ==========================================================================
   BACKEND API — ganti dengan URL backend kamu setelah deploy ke Vercel.
   Contoh: "https://portfolio-backend-daffa.vercel.app"
   Backend-nya ada di folder /backend, deploy terpisah dari GitHub Pages ini.
   ========================================================================== */
const API_BASE = "https://portfolio-eight-virid-je2suqvcy9.vercel.app";

async function loadProfile() {
  const res = await fetch("profile.json", { cache: "no-store" });
  if (!res.ok) throw new Error("profile.json tidak ditemukan");
  return res.json();
}

/* ==========================================================================
   RENDER — mengisi HTML dari profile.json.
   Biasanya kamu tidak perlu mengubah bagian ini.
   ========================================================================== */
function renderProfile(p) {
  document.title = `${p.name.split(" ")[0]} — Portfolio`;

  setText("handle", p.handle);
  setText("handleQuoted", `"${p.handle}"`);
  setText("statusText", p.status);
  setText("eduText", p.education);
  setText("heroName", p.name);
  setText("heroTagline", p.tagline);
  setText("heroLede", p.lede);
  setText("aboutBio", p.bio);
  setText("aiHeaderTitle", `${p.handle.split(".")[0]}-ai — bash`);

  const aboutWords = p.bio.split(/\s+/).length;
  document.getElementById("aboutDiffstat").innerHTML =
    `1 file changed, <span class="add">${aboutWords} insertions(+)</span>`;

  // avatar — pakai foto kalau file-nya ada, kalau tidak tampilkan inisial.
  // fallback ditampilkan lebih dulu supaya tidak ada ikon gambar rusak
  // yang sempat kelihatan sebelum foto asli selesai dimuat.
  const avatarImg = document.getElementById("avatarImg");
  const avatarFallback = document.getElementById("avatarFallback");
  avatarFallback.textContent = getInitials(p.name);
  avatarFallback.hidden = false;
  if (p.avatar) {
    avatarImg.addEventListener("load", () => {
      avatarImg.hidden = false;
      avatarFallback.hidden = true;
    });
    avatarImg.alt = `Foto ${p.name}`;
    avatarImg.src = p.avatar;
  }

  // social links
  setHref("socialGithub", p.contact.github);
  setHref("socialLinkedin", p.contact.linkedin);
  setHref("socialEmail", `mailto:${p.contact.email}`);

  // skills
  const skillWrap = document.getElementById("skillGroups");
  skillWrap.innerHTML = Object.entries(p.skills).map(([label, items]) => `
    <div class="skill-group">
      <p class="skill-group__label">${label}</p>
      <div class="skill-tags">
        ${items.map(item => `<span class="skill-tag${label === "Sedang dipelajari" ? " is-learning" : ""}">${item}</span>`).join("")}
      </div>
    </div>
  `).join("");

  // projects
  const projectWrap = document.getElementById("projectList");
  projectWrap.innerHTML = p.projects.map(proj => `
    <article class="project">
      <div class="project__head">
        <span class="project__name">${proj.name}</span>
        <span class="diffstat"><span class="add">+${proj.stats.add}</span> <span class="remove">-${proj.stats.remove}</span></span>
      </div>
      <p class="project__desc">${proj.description}</p>
      <div class="project__tags">
        ${proj.stack.map(s => `<span class="project__tag">${s}</span>`).join("")}
      </div>
      <div class="project__links">
        <a href="${proj.demo}" target="_blank" rel="noopener">demo</a>
        <a href="${proj.repo}" target="_blank" rel="noopener">source</a>
      </div>
    </article>
  `).join("");

  // contact list
  const contactWrap = document.getElementById("contactList");
  const rows = [
    { label: "email", value: p.contact.email, href: `mailto:${p.contact.email}` },
    { label: "github", value: p.contact.github.replace("https://", ""), href: p.contact.github },
    { label: "linkedin", value: p.contact.linkedin.replace("https://", ""), href: p.contact.linkedin }
  ];
  if (p.contact.whatsapp) {
    rows.push({ label: "whatsapp", value: "chat langsung", href: p.contact.whatsapp });
  }
  contactWrap.innerHTML = rows.map(r => `
    <li>${r.label}: <a href="${r.href}" target="_blank" rel="noopener">${r.value}</a></li>
  `).join("");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function setHref(id, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("href", value);
}
function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

/* ==========================================================================
   BOOT SEQUENCE — satu momen animasi saat halaman pertama dibuka
   ========================================================================== */
function runBoot(p) {
  const boot = document.getElementById("boot");
  const log = document.getElementById("bootLog");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    boot.classList.add("boot--done");
    boot.setAttribute("hidden", "");
    return;
  }

  const lines = [
    "$ whoami",
    `> ${p.handle}`,
    "$ status --check",
    `> ${p.status.replace(/ /g, "_")}: true`,
    "$ ./start-portfolio.sh"
  ];

  let lineIndex = 0;
  let charIndex = 0;
  let rendered = "";

  function typeNext() {
    if (lineIndex >= lines.length) {
      setTimeout(() => {
        boot.classList.add("boot--done");
        setTimeout(() => boot.setAttribute("hidden", ""), 500);
      }, 300);
      return;
    }
    const currentLine = lines[lineIndex];
    if (charIndex < currentLine.length) {
      rendered += currentLine[charIndex];
      log.textContent = rendered;
      charIndex++;
      setTimeout(typeNext, 18);
    } else {
      rendered += "\n";
      log.textContent = rendered;
      lineIndex++;
      charIndex = 0;
      setTimeout(typeNext, 180);
    }
  }
  typeNext();
}

/* ==========================================================================
   ACTIVE BRANCH — highlight nav sesuai section yang sedang dilihat
   ========================================================================== */
function watchSections() {
  const sections = document.querySelectorAll(".commit[id]");
  const branches = document.querySelectorAll(".branch");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        branches.forEach(b => b.classList.remove("active"));
        const match = document.querySelector(`.branch[data-target="${entry.target.id}"]`);
        if (match) match.classList.add("active");
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });

  sections.forEach(s => observer.observe(s));
}

/* ==========================================================================
   UPTIME COUNTER — detail kecil yang genuinely live, bukan cuma dekorasi
   ========================================================================== */
function startUptime() {
  const start = Date.now();
  const el = document.getElementById("uptime");
  setInterval(() => {
    const diff = Math.floor((Date.now() - start) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

/* ==========================================================================
   FALLBACK LOKAL — dipakai HANYA kalau backend /api/chat tidak terjangkau
   (misalnya belum di-deploy dengan server.js, atau server sedang down).
   Ini jaring pengaman supaya widget tidak pernah terasa mati total.
   ========================================================================== */
function buildLocalKnowledgeBase(p) {
  const firstName = p.name.split(" ")[0];
  const allSkills = Object.values(p.skills).flat().join(", ");
  const projectNames = p.projects.map(proj => proj.name).join(", ");

  return [
    { keywords: ["siapa", "kenalan", "tentang", "who"], answer: `${p.name} — ${p.tagline} ${p.bio}` },
    { keywords: ["skill", "bisa apa", "keahlian", "tech stack", "kemampuan"], answer: `Beberapa hal yang dikuasai ${firstName}: ${allSkills}.` },
    { keywords: ["project", "karya", "portofolio", "portfolio"], answer: `Beberapa project yang pernah dibuat: ${projectNames}. Detail lengkapnya ada di bagian "work" di halaman ini.` },
    { keywords: ["magang", "internship", "kerja", "kesempatan", "status"], answer: `${firstName} sedang ${p.status} dan terbuka untuk kesempatan magang atau kolaborasi project.` },
    { keywords: ["kontak", "hubungi", "email", "contact", "kuliah", "kampus", "pendidikan"], answer: `${p.education}. Bisa dihubungi lewat email: ${p.contact.email}.` }
  ];
}

function findLocalAnswer(question, kb, p) {
  const q = question.toLowerCase();
  for (const entry of kb) {
    if (entry.keywords.some(k => q.includes(k))) return entry.answer;
  }
  return `Belum ada jawaban siap untuk itu — coba tanya soal skill, project, pendidikan, status magang, atau kontak. Atau langsung email ke ${p.contact.email}.`;
}

/* ==========================================================================
   AI ASSISTANT — coba panggil Gemini lewat backend (/api/chat) dulu.
   Kalau backend tidak ada/gagal, otomatis jatuh ke jawaban lokal di atas
   supaya widget-nya tetap terasa hidup walau belum di-deploy dengan server.
   ========================================================================== */
function initAI(p) {
  const toggle = document.getElementById("aiToggle");
  const panel = document.getElementById("aiPanel");
  const closeBtn = document.getElementById("aiClose");
  const form = document.getElementById("aiForm");
  const input = document.getElementById("aiInput");
  const log = document.getElementById("aiLog");
  const kb = buildLocalKnowledgeBase(p);
  const history = [];
  let greeted = false;

  function addMessage(text, who) {
    const el = document.createElement("div");
    el.className = `ai-msg ai-msg--${who}`;
    const prefix = who === "user" ? "❯" : `${p.handle.split(".")[0]}-ai>`;
    el.innerHTML = `<span class="ai-msg__prefix">${prefix}</span> ${text}`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    if (!greeted) {
      addMessage(`Hai, tanya-tanya soal ${p.name.split(" ")[0]} di sini aja.`, "bot");
      greeted = true;
    }
    input.focus();
  }
  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    panel.hidden ? openPanel() : closePanel();
  });
  closeBtn.addEventListener("click", closePanel);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    addMessage(question, "user");
    input.value = "";

    const thinking = addMessage("mengetik…", "bot");

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history: history.slice(-8) })
      });
      if (!res.ok) throw new Error(`server merespons ${res.status}`);
      const data = await res.json();
      thinking.remove();
      addMessage(data.reply, "bot");
      history.push({ role: "user", text: question }, { role: "model", text: data.reply });
    } catch (err) {
      // backend belum ada / gagal dihubungi -> jatuh ke jawaban lokal
      thinking.remove();
      addMessage(findLocalAnswer(question, kb, p), "bot");
    }
  });
}

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    profile = await loadProfile();
  } catch (err) {
    console.error("Gagal memuat profile.json:", err);
    return; // halaman tetap menampilkan teks placeholder bawaan di index.html
  }
  renderProfile(profile);
  runBoot(profile);
  watchSections();
  startUptime();
  initAI(profile);
});
