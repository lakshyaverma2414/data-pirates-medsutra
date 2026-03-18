import { useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  Send,
  Hospital,
  Droplets,
  Ambulance,
  Calendar,
  Bot,
} from "lucide-react";
import { motion } from "motion/react";
import { MobileMenu } from "../../../shared/components/mobile-menu";
import { BackButton } from "../../../shared/components/back-button";

export function MedicalChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hello! I'm MedSutra AI Assistant. How can I help you today?",
      time: "10:30 AM",
    },
  ]);

  const quickActions = [
    {
      icon: Hospital,
      label: "Find nearest hospital",
      action: "/find-hospitals",
    },
    {
      icon: Droplets,
      label: "Check blood availability",
      action: "/blood-donation",
    },
    { icon: Ambulance, label: "Request ambulance", action: "/emergency" },
    {
      icon: Calendar,
      label: "Book consultation",
      action: "/book-consultation",
    },
  ];

  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        text: "I understand you need help. Let me assist you with that. You can use the quick actions below for common tasks, or describe your symptoms for personalized guidance.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <MobileMenu userType="user" />
          <BackButton />
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#C0392B]" />
            <span
              className="text-lg"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              MedSutra
            </span>
          </Link>
        </div>
      </header>

      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4A6F] text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h1
                className="text-2xl mb-1"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                MedSutra AI Assistant
              </h1>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Online • Instant Response
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-foreground/60 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.action}
                className="p-4 border-2 border-border rounded-xl hover:border-[#1F3A5F] hover:bg-[#1F3A5F]/5 transition text-center"
              >
                <action.icon className="w-6 h-6 mx-auto mb-2 text-[#1F3A5F]" />
                <p className="text-xs text-foreground/80">{action.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-3 ${
                  msg.type === "user"
                    ? "bg-[#1F3A5F] text-white"
                    : "bg-white shadow-md"
                }`}
              >
                <p className="text-sm mb-1">{msg.text}</p>
                <p
                  className={`text-xs ${msg.type === "user" ? "text-white/60" : "text-foreground/40"}`}
                >
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-border px-4 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message or describe symptoms..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-border focus:border-[#1F3A5F] outline-none transition"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-[#1F3A5F] text-white rounded-xl hover:bg-[#2A4A6F] transition flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
