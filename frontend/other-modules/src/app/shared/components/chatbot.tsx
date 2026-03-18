import { useEffect, useRef, useState } from "react";
import { X, MessageCircle, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ChatRole = "user" | "bot";

type ChatMessage = {
  role: ChatRole;
  content: string;
  tone?: "default" | "error";
};

type QuickOption = {
  label: string;
  route?: string;
  prompt?: string;
};

type ChatbotProps = {
  hospitalId?: string;
};

const AI_API_BASE_URL = (
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_AI_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "bot",
    content:
      "Hello! I'm your MedSutra assistant. Ask me about hospital capacity, emergencies, blood stock, or what to do next.",
  },
];

const QUICK_OPTIONS: QuickOption[] = [
  { label: "Report Emergency", route: "/emergency" },
  {
    label: "Find Hospital",
    prompt:
      "Help me find a suitable hospital from the current MedSutra network and tell me what details I should check first.",
  },
  { label: "Request Ambulance", route: "/emergency" },
  { label: "Donate Blood", route: "/blood-donation" },
  {
    label: "Check Blood Availability",
    prompt:
      "Check blood availability from the current MedSutra hospital context and tell me what blood groups look available right now.",
  },
];

async function requestChatReply(message: string, hospitalId: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = window.localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${AI_API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ hospitalId, message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to reach the AI assistant.");
  }

  const payload = await response.json().catch(() => ({}));
  const reply =
    payload && typeof payload.reply === "string" ? payload.reply.trim() : "";

  if (!reply) {
    throw new Error("The AI assistant returned an empty response.");
  }

  if (reply.toLowerCase().startsWith("error processing request:")) {
    throw new Error(reply);
  }

  return reply;
}

export function Chatbot({ hospitalId = "1" }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async (
    rawMessage: string,
    { displayMessage }: { displayMessage?: string } = {},
  ) => {
    const trimmedMessage = rawMessage.trim();
    if (!trimmedMessage || isSending) {
      return;
    }

    setInput("");
    setMessages((current) => [
      ...current,
      { role: "user", content: displayMessage?.trim() || trimmedMessage },
    ]);
    setIsSending(true);

    try {
      const reply = await requestChatReply(trimmedMessage, hospitalId);
      setMessages((current) => [
        ...current,
        { role: "bot", content: reply, tone: "default" },
      ]);
    } catch (error) {
      const detail =
        error instanceof Error && error.message
          ? ` ${error.message}`
          : "";

      setMessages((current) => [
        ...current,
        {
          role: "bot",
          content: `I could not get a reply from the MedSutra AI service right now.${detail}`,
          tone: "error",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickOption = (option: QuickOption) => {
    if (option.route) {
      window.location.assign(option.route);
      return;
    }

    void sendMessage(option.prompt || option.label, {
      displayMessage: option.label,
    });
  };

  const handleSend = () => {
    void sendMessage(input);
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
                          : message.tone === "error"
                            ? "bg-[#FFF5F5] border border-[#F5C2C7] text-[#8A1C1C]"
                            : "bg-white border border-border text-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))}

              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-white border border-border text-foreground">
                    MedSutra Assistant is thinking...
                  </div>
                </motion.div>
              )}

              {/* Quick Options */}
              {messages.length === 1 && !isSending && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground/60 text-center">Quick Actions:</p>
                  {QUICK_OPTIONS.map((option, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleQuickOption(option)}
                      disabled={isSending}
                      className="w-full p-3 bg-white border border-border rounded-xl hover:border-[#1F3A5F] hover:bg-[#1F3A5F]/5 transition text-left"
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || !input.trim()}
                  className="w-10 h-10 bg-[#1F3A5F] text-white rounded-xl hover:bg-[#2A4A6F] transition flex items-center justify-center disabled:cursor-not-allowed disabled:bg-[#93A3B8]"
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
