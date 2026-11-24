import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import "./styles.css";

const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
  transports: ["websocket", "polling"],
});

function formatTime(value) {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function App() {
  const [name, setName] = useState("Guest");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState(0);
  const [connected, setConnected] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onActive = (count) => setOnline(count);
    const onMessage = (message) => {
      setMessages((current) => [...current, { type: "message", ...message }]);
    };
    const onSystem = (text) => {
      setMessages((current) => [...current, { type: "system", text }]);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("active", onActive);
    socket.on("message", onMessage);
    socket.on("chat", onSystem);
    socket.on("join", onSystem);
    socket.on("announce", onSystem);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("active", onActive);
      socket.off("message", onMessage);
      socket.off("chat", onSystem);
      socket.off("join", onSystem);
      socket.off("announce", onSystem);
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    socket.emit("msg", {
      text,
      sender: name.trim() || "Guest",
    });
    setDraft("");
  };

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <h1>Chatroom</h1>
            <p>Socket.IO</p>
          </div>
        </div>

        <label htmlFor="name">Display name</label>
        <input
          id="name"
          type="text"
          maxLength={30}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />

        <div className={`status ${connected ? "connected" : ""}`}>
          <span className="status-dot" />
          <span>{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </aside>

      <section className="chat">
        <header className="chat-header">
          <div>
            <h2>Global chat</h2>
            <span>
              {online} {online === 1 ? "person" : "people"} online
            </span>
          </div>
        </header>

        <div ref={messagesRef} className="messages" aria-live="polite">
          {messages.map((message, index) =>
            message.type === "system" ? (
              <div className="system-message" key={index}>
                {message.text}
              </div>
            ) : (
              <div
                className={`message ${
                  message.sender === name.trim() ? "mine" : ""
                }`}
                key={index}
              >
                <span className="message-meta">{message.sender}</span>
                <span>{message.text}</span>
                <span className="message-time">{formatTime(message.at)}</span>
              </div>
            )
          )}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            type="text"
            maxLength={500}
            placeholder="Type a message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" aria-label="Send message" disabled={!draft.trim()}>
            &#10148;
          </button>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
