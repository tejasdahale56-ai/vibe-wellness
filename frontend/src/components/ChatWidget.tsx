"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, X, Sparkles } from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage } from "@/types";

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your wellness companion. Ask me anything about your patterns, experiments, or how you're feeling today." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage([...messages, userMessage]);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const clearChat = () => {
    setMessages([
      { role: "assistant", content: "Hi! I'm your wellness companion. Ask me anything about your patterns, experiments, or how you're feeling today." }
    ]);
  };

  return (
    <div className="chat-widget" style={{ display: "flex", flexDirection: "column", height: isOpen ? "420px" : "60px" }}>
      <div 
        className="chat-header" 
        onClick={toggleChat}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-raised)",
          borderRadius: isOpen ? "var(--radius-card) var(--radius-card) 0 0" : "var(--radius-card)",
          cursor: "pointer",
          transition: "border-radius 0.2s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ 
            width: "32px", 
            height: "32px", 
            borderRadius: "50%", 
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "#172017"
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-text)" }}>VIBE Assistant</h3>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--color-subtle)" }}>{isOpen ? "Online" : "Click to open"}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); clearChat(); }}
              style={{
                padding: "6px 10px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-control)",
                background: "transparent",
                color: "var(--color-muted)",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text)"}
              onMouseOut={(e) => e.currentTarget.style.color = "var(--color-muted)"}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div 
          ref={chatContainerRef}
          className="chat-messages" 
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "var(--color-surface)"
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${msg.role}`}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                maxWidth: "85%"
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: msg.role === "user" 
                    ? "var(--color-accent)" 
                    : "linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))",
                  color: msg.role === "user" ? "#172017" : "#172017"
                }}
              >
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" 
                    ? "18px 18px 4px 18px" 
                    : "18px 18px 18px 4px",
                  background: msg.role === "user" 
                    ? "var(--color-accent)" 
                    : "var(--color-surface-raised)",
                  color: msg.role === "user" ? "#172017" : "var(--color-text)",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  border: msg.role === "assistant" ? "1px solid var(--color-border)" : "none",
                  boxShadow: msg.role === "assistant" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {isOpen && (
        <form onSubmit={handleSend} className="chat-input" style={{ 
          display: "flex", 
          gap: "8px", 
          padding: "12px 16px", 
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface-raised)",
          borderRadius: "0 0 var(--radius-card) var(--radius-card)"
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your wellness..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-control)",
              background: "var(--color-page)",
              color: "var(--color-text)",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "var(--color-accent-strong)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "10px 14px",
              border: "none",
              borderRadius: "var(--radius-control)",
              background: input.trim() && !isLoading ? "var(--color-accent)" : "var(--color-border)",
              color: input.trim() && !isLoading ? "#172017" : "var(--color-subtle)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            {isLoading ? (
              <span style={{ display: "flex", gap: "4px" }}>
                <span style={{ width: "16px", height: "16px", border: "2px solid transparent", borderTopColor: "#172017", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              </span>
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}