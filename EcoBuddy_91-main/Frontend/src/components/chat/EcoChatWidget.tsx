import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const EcoChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chatbot", { message: input });
      const botReply = res.data.reply || "No response";
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "bot", text: "⚠️ Could not connect to EcoBot" }]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-600 text-white rounded-full w-16 h-16 shadow-lg hover:bg-green-700 transition text-xl"
      >
        💬
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-0 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            <div className="bg-green-600 text-white p-3 font-bold text-lg">🌱 EcoBot</div>
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-xl max-w-[75%] ${
                    msg.sender === "user" ? "ml-auto bg-green-100" : "mr-auto bg-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="mr-auto bg-gray-200 p-2 rounded-xl max-w-[75%] animate-pulse">
                  EcoBot is typing...
                </div>
              )}
            </div>
            <div className="p-2 border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 border rounded-lg px-2 py-2 text-sm"
                placeholder="Ask EcoBot..."
              />
              <button
                onClick={sendMessage}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EcoChatWidget;
