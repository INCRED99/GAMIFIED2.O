// -------------------------------
// 🌱 EcoBot Backend Server
// -------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

// ✅ IMPORTANT: Update this with your exact deployed Vercel frontend URL
app.use(cors({
  origin: [
    "https://gamifiedwebapp.vercel.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// -------------------------------
// 🧠 Chatbot API Route
// -------------------------------
app.post("/api/chatbot", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(userMessage);
    const botReply = result.response.text();

    res.json({ reply: botReply });
  } catch (error) {
    console.error("❌ Error connecting to Gemini:", error);
    res.status(500).json({ reply: "⚠️ Server error. Try again later." });
  }
});

// -------------------------------
// 🚀 Start Server
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ EcoBot backend running on port ${PORT}`));
