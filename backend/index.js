//
// Main entry point for the Code Battle server
//
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"], // Add your live URL
    methods: ["GET", "POST"],
  },
});

  
app.use(cors());
app.use(express.json());

// --- API Routes ---
// TODO: We will add our API routes here later
const healthRoutes = require('./src/api/routes/healthRoutes');
app.use('/api', healthRoutes);

const leaderboardRoutes = require('./src/api/routes/leaderboardRoutes'); // Add this line

app.use('/api', healthRoutes);
app.use('/api', leaderboardRoutes);

// --- Socket.IO Connection Handling ---
// TODO: We will set up our socket logic here
const { initializeSocket } = require('./src/sockets/socketManager');
initializeSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
