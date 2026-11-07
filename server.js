require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM = `You are NEXORA AI, a helpful, honest, multilingual assistant.
Reply in the language the user uses unless they request another language.
Be clear, useful, safe, and transparent about uncertainty. Never claim you performed
actions you did not perform. For current facts, say when live browsing is unavailable.
When the user uploads an image, describe and analyze only what is visible.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, mode, language } = req.body || {};
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "AI is not connected yet. Add GEMINI_API_KEY in your hosting environment."
      });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Please send a message." });
    }

    const recent = messages.slice(-16);
    const contents = recent.map((m) => {
      const parts = [];
      if (m.text) parts.push({ text: String(m.text).slice(0, 20000) });
      if (m.image && typeof m.image.data === "string" && typeof m.image.mimeType === "string") {
        parts.push({
          inline_data: {
            mime_type: m.image.mimeType,
            data: m.image.data
          }
        });
      }
      return { role: m.role === "assistant" ? "model" : "user", parts };
    }).filter(m => m.parts.length);

    const modeHints = {
      chat: "Answer naturally and helpfully.",
      study: "Act as a patient tutor. Explain step by step and encourage understanding.",
      code: "Act as a senior programming assistant. Give correct, runnable code and explain setup.",
      write: "Help create polished writing. Match the requested tone and format.",
      translate: "Translate accurately. Preserve meaning, tone, and formatting.",
      summarize: "Summarize the supplied material into clear, structured key points.",
      brainstorm: "Generate original, practical ideas and explain why they may work."
    };
    const prompt = `${SYSTEM}\nPreferred language: ${language || "auto"}.\nMode: ${modeHints[mode] || modeHints.chat}`;
    if (contents.length && contents[0].role === "user") {
      contents[0].parts.unshift({ text: prompt });
    } else {
      contents.unshift({ role: "user", parts: [{ text: prompt }] });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "The AI provider returned an error."
      });
    }
    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || "")
      .join("\n").trim();
    if (!answer) return res.status(502).json({ error: "The AI returned an empty response. Try again." });
    res.json({ answer, model });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong on the server. Please try again." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "NEXORA AI" }));

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`NEXORA AI running on http://localhost:${PORT}`));