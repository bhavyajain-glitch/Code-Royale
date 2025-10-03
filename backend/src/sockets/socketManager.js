// This module will initialize and manage the Socket.IO server and its events.

function initializeSocket(io) {
    // io.on is the primary event listener. 
    // It listens for 'connection', which is a built-in event.
    // This event fires every time a new client connects.
    io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);
  
      // --- Register Event Handlers ---
      // We will register our custom event handlers here, like 'createRoom' or 'submitCode'.
  
  
      // --- Disconnect Handler ---
      // 'disconnect' is another built-in event that fires when a client closes the connection.
      socket.on('disconnect', () => {
        console.log(`🔥 Client disconnected: ${socket.id}`);
      });
    });
  }
  
  module.exports = { initializeSocket };