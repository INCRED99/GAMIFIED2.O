// -------------------------------
// 🌱 EcoBot Backend Server
// -------------------------------
// This server connects your frontend chatbot UI (EcoChatWidget.tsx)
// to the Gemini API using Express, CORS, and dotenv for environment variables.
// -------------------------------

// Import dependencies
import express from "express";                  // Web framework for routing
import cors from "cors";                        // Enables cross-origin requests
import dotenv from "dotenv";                    // Loads environment variables from .env
import { GoogleGenerativeAI } from "@google/generative-ai"; // Gemini SDK

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware setup
app.use(cors({
  origin: "https://gamifiedwebapp.vercel.app",
  methods: ["GET", "POST"],
  credentials: true
}));            // Allow frontend (React) to access backend
app.use(express.json());    // Parse incoming JSON requests

// Initialize Gemini API client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// -------------------------------
// 🧠 Chatbot Route
// -------------------------------
// The frontend sends user messages to this endpoint.
// The server forwards them to Gemini and returns the AI's response.
app.post("/api/chatbot", async (req, res) => {
  try {
    const userMessage = req.body.message; // Get the message sent by the user

    // Create a model instance for Gemini 1.5 Pro
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Send user's input to Gemini and get the generated response
    const result = await model.generateContent(userMessage);

    // Extract text from the Gemini response
    const botReply = result.response.text();

    // Send the AI's reply back to the frontend
    res.json({ reply: botReply });
  } catch (error) {
    console.error("❌ Error connecting to Gemini:", error);
    res.status(500).json({ reply: "⚠️ Server error: could not get a response from Gemini." });
  }
});

// -------------------------------
// 🚀 Start Server
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ EcoBot backend running on http://localhost:${PORT}`));
