const fs = require("fs");
const path = require("path");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const profile = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "profile.json"), "utf-8")
);

function buildSystemPrompt(p) {
  const skillsText = Object.entries(p.skills)
    .map(([group, items]) => `- ${group}: ${items.join(", ")}`)
    .join("\n");
  const projectsText = p.projects
    .map((proj, i) => `${i + 1}. ${proj.name} (${proj.stack.join(", ")}) — ${proj.description}`)
    .join("\n");

  return `Kamu adalah asisten AI di website portfolio milik ${p.name}.

Informasi tentang pemilik portfolio (hanya gunakan fakta di bawah ini):
- Nama: ${p.name}
- Status: ${p.status}
- Pendidikan: ${p.education}
- Tentang: ${p.bio}
- Skill:
${skillsText}
- Project:
${projectsText}
- Kontak: ${p.contact.email}

Aturan menjawab:
- Jawab dalam Bahasa Indonesia kecuali pengunjung bertanya dalam bahasa lain.
- Singkat saja, maksimal 3-4 kalimat.
- Jangan mengarang informasi yang tidak ada di atas.
- Kalau ditanya sesuatu yang tidak kamu ketahui jawabannya, arahkan untuk
  menghubungi langsung lewat email di atas.
- Kalau ditanya hal di luar konteks portfolio ini, arahkan kembali dengan sopan
  ke topik seputar ${p.name}.`;
}

const SYSTEM_PROMPT = buildSystemPrompt(profile);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "message wajib diisi" });
      return;
    }
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY belum di-set di Environment Variables Vercel");
      res.status(500).json({ error: "server belum dikonfigurasi" });
      return;
    }

    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-8)) {
        if (!turn || typeof turn.text !== "string") continue;
        contents.push({
          role: turn.role === "model" ? "model" : "user",
          parts: [{ text: turn.text.slice(0, 1000) }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message.trim().slice(0, 1000) }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 300, temperature: 0.6 }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      res.status(502).json({ error: "gagal menghubungi Gemini API" });
      return;
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim() ||
      "Maaf, aku belum bisa jawab itu sekarang — coba tanya dengan cara lain.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Error di /api/chat:", err);
    res.status(500).json({ error: "terjadi kesalahan di server" });
  }
};
