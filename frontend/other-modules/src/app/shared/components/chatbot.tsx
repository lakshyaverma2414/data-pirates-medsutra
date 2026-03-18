import { useState } from "react";
import { X, MessageCircle, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hello! I'm your MedSutra assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");

  const quickOptions = [
    { label: "Report Emergency", action: "/emergency" },
    { label: "Find Hospital", action: "find-hospital" },
    { label: "Request Ambulance", action: "/emergency" },
    { label: "Donate Blood", action: "/blood-donation" },
    { label: "Check Blood Availability", action: "/blood-donation" },
  ];

  const handleQuickOption = (option: { label: string; action: string }) => {
    if (option.action.startsWith("/")) {
      // It's a route
      window.location.href = option.action;
    } else {
      // Send as message
      setMessages([
        ...messages,
        { role: "user", content: option.label },
        {
          role: "bot",
          content: `I can help you with that. ${
            option.action === "find-hospital"
              ? "Here are nearby hospitals with availability..."
              : "Let me assist you with this request."
          }`,
        },
      ]);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    setMessages([
      ...messages,
      { role: "user", content: userMessage },
      {
        role: "bot",
        content:
          "Thank you for your message. Our system is processing your request. For emergencies, please use the 'Report Emergency' option or call 1800-MEDSUTRA.",
      },
    ]);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-[#1F3A5F] text-white rounded-full shadow-2xl hover:bg-[#2A4A6F] transition flex items-center justify-center z-50 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C0392B] rounded-full animate-pulse"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-border"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4A6F] text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
                    MedSutra Assistant
                  </h3>
                  <p className="text-xs text-white/80">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F7FA]">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      message.role === "user"
                        ? "bg-[#1F3A5F] text-white"
                        : "bg-white border border-border text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}

              {/* Quick Options */}
              {messages.length === 1 && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground/60 text-center">Quick Actions:</p>
                  {quickOptions.map((option, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleQuickOption(option)}
                      className="w-full p-3 bg-white border border-border rounded-xl hover:border-[#1F3A5F] hover:bg-[#1F3A5F]/5 transition text-left"
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                />
                <button
                  onClick={handleSend}
                  className="w-10 h-10 bg-[#1F3A5F] text-white rounded-xl hover:bg-[#2A4A6F] transition flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
