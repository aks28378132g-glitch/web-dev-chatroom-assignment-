// npm init -y, npm i express socket.io
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:8080"];

const io = new Server(httpserver, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.use(express.static(__dirname + "/dist"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/dist/index.html");
});

// To manage Active user count
let count = 0;

io.on("connection", (socket) => {
  count++;
  console.log("Active User: ", count); // terminal/backend
  io.emit("active", count); // frontend/client

  console.log("Connected Established");

  socket.emit("chat", "Hello from server side");

  // To broadcast a message
  io.emit("join", "New User Joined");

  socket.on("msg", (payload) => {
    const message = typeof payload === "string"
      ? { text: payload, sender: "Guest", at: new Date().toISOString() }
      : {
          text: String(payload.text || "").trim(),
          sender: String(payload.sender || "Guest").trim().slice(0, 30),
          at: new Date().toISOString()
        };

    if (!message.text) return;
    message.text = message.text.slice(0, 500);
    io.emit("message", message);
    console.log(`${message.sender}: ${message.text}`);
  });

  // handling disconnect event
  socket.on("disconnect", () => {
    count--;
    console.log("Active User: ", count); // terminal/backend
    io.emit("active", count);
  });

  // For making announcement
  io.emit("announce", "Only 5hr class left");
});

const port = process.env.PORT || 8080;
httpserver.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
