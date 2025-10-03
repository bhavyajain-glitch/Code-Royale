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
      // We'll replace this with the Vercel URL in production
      origin: 'http://localhost:5173', 
      methods: ['GET', 'POST'],
    },
  });

  
app.use(cors());
app.use(express.json());

// --- API Routes ---
// TODO: We will add our API routes here later
const healthRoutes = require('./src/api/routes/healthRoutes');
app.use('/api', healthRoutes);

// --- Socket.IO Connection Handling ---
// TODO: We will set up our socket logic here
const { initializeSocket } = require('./src/sockets/socketManager');
initializeSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
