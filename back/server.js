require("dotenv").config();
const express = require("express");
const { connectDB } = require("./db/db");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const indexRoutes = require("./routes/indexRoutes");
const socketManager = require("./socketManager/SocketManager");

const app = express();
const port = process.env.PORT ;

// Middlewares
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Static and API routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", indexRoutes);

// Create single HTTP server from Express
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make Socket.IO globally accessible
global.io = io;

// Initialize socket manager
socketManager.initializeSocket(io);

// Start server (for both API and Socket.IO)
server.listen(port, () => {
  connectDB();
  console.log(`Server with DB and Socket.IO is running on port ${port}`);
});
