require("dotenv").config();
const express = require("express");
const { connectDB } = require("./db/db");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const cookieParser = require("cookie-parser");
const passport = require('passport');
const session = require('express-session');

const indexRoutes = require("./routes/indexRoutes");
const socketManager = require("./socketManager/SocketManager");

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
app.use(cookieParser());
const port = process.env.PORT;

app.use(session({
  secret: 'sdh@hehf',
  resave: true,
  saveUninitialized: true,
}));

const allowedOrigins = [
  'https://chat-message-2.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'app://.',
  'file://'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS origin not allowed: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middlewares
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

// Static and API routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", indexRoutes);

// Create single HTTP server from Express
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
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
