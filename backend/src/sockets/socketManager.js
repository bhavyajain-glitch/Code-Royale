const { auth } = require('../services/firebaseAdmin');
const problems = require('../data/problems.json');

// In-memory storage for rooms. A real app would use Redis or a database.
const rooms = {};

async function verifyToken(token) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on('createRoom', async ({ idToken }) => {
      const decodedToken = await verifyToken(idToken);
      if (!decodedToken) {
        return socket.emit('error', { message: 'Invalid authentication token.' });
      }

      const roomId = Math.random().toString(36).substring(2, 8);
      socket.join(roomId);
      
      rooms[roomId] = {
        roomId,
        players: [{ 
          socketId: socket.id, 
          uid: decodedToken.uid,
          email: decodedToken.email 
        }],
        problem: null
      };

      socket.emit('roomCreated', { roomId });
      console.log(`[Room ${roomId}] Created by ${decodedToken.email} (${decodedToken.uid})`);
    });

    socket.on('joinRoom', async ({ idToken, roomId }) => {
      const decodedToken = await verifyToken(idToken);
      if (!decodedToken) {
        return socket.emit('error', { message: 'Invalid authentication token.' });
      }

      const room = rooms[roomId];

      // Make sure the room exists before proceeding
      if (!room) {
        return socket.emit('error', { message: 'Room does not exist.' });
      }
      
      // --- BUG FIX ---
      // Check if the user trying to join is already one of the players in the room.
      const playerAlreadyInRoom = room.players.some(player => player.uid === decodedToken.uid);

      if (playerAlreadyInRoom) {
        console.log(`[Room ${roomId}] ${decodedToken.email} is already in this room.`);
        return; // Stop execution to prevent re-joining
      }
      // --- END FIX ---

      if (room.players.length < 2) {
        socket.join(roomId);
        room.players.push({ 
          socketId: socket.id, 
          uid: decodedToken.uid,
          email: decodedToken.email 
        });
        console.log(`[Room ${roomId}] ${decodedToken.email} joined.`);

        if (room.players.length === 2) {
          const problem = problems[Math.floor(Math.random() * problems.length)];
          room.problem = problem;
          io.to(roomId).emit('gameStart', { problem, players: room.players });
          console.log(`[Room ${roomId}] Game started. Problem: ${problem.title}`);
        }
      } else {
        socket.emit('error', { message: 'Room is full.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔥 Client disconnected: ${socket.id}`);
      // TODO: Add logic to handle a player disconnecting from a room mid-game.
    });
  });
}

module.exports = { initializeSocket };