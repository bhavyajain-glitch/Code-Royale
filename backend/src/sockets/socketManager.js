const { auth, db } = require('../services/firebaseAdmin'); // Import db
const problems = require('../data/problems.json');
const axios = require('axios');
const { recordBattleOutcome } = require('../services/battleService');

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

      // --- NEW: Fetch username from Firestore ---
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const username = userDoc.exists ? userDoc.data().username : decodedToken.email;

      const roomId = Math.random().toString(36).substring(2, 8);
      socket.join(roomId);
      rooms[roomId] = {
        roomId,
        players: [{ 
          socketId: socket.id, 
          uid: decodedToken.uid,
          email: decodedToken.email,
          username: username // Add username to the player object
        }],
        problem: null
      };
      socket.emit('roomCreated', { roomId });
      console.log(`[Room ${roomId}] Created by ${username}`);
    });

    socket.on('joinRoom', async ({ idToken, roomId }) => {
      const decodedToken = await verifyToken(idToken);
      if (!decodedToken) {
        return socket.emit('error', { message: 'Invalid authentication token.' });
      }
      
      // --- NEW: Fetch username from Firestore ---
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const username = userDoc.exists ? userDoc.data().username : decodedToken.email;
      
      const room = rooms[roomId];
      if (!room) {
        return socket.emit('error', { message: 'Room does not exist.' });
      }
      const playerAlreadyInRoom = room.players.some(player => player.uid === decodedToken.uid);
      if (playerAlreadyInRoom) {
        console.log(`[Room ${roomId}] ${username} is already in this room.`);
        return;
      }
      if (room.players.length < 2) {
        socket.join(roomId);
        room.players.push({ 
          socketId: socket.id, 
          uid: decodedToken.uid,
          email: decodedToken.email,
          username: username // Add username to the player object
        });
        console.log(`[Room ${roomId}] ${username} joined.`);
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
    
    socket.on('submitCode', async ({ roomId, code }) => {
      const room = rooms[roomId];
      if (!room || !room.problem) return;
      
      const submittingPlayer = room.players.find(p => p.socketId === socket.id);
      if (!submittingPlayer) return;
      
      console.log(`[Room ${roomId}] Code submission from ${submittingPlayer.username}`);
      const problem = room.problem;

      try {
        for (const testCase of problem.testCases) {
          const executionScript = `
# User's submitted function
${code}

# Call the function and print the result
print(${problem.functionName}(${testCase.input}))
          `;

          const submissionResponse = await axios.post(
            'https://judge0-ce.p.rapidapi.com/submissions',
            { language_id: 71, source_code: executionScript },
            {
              params: { base64_encoded: 'false', fields: '*' },
              headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
              }
            }
          );
          
          const submissionToken = submissionResponse.data.token;
          
          let resultResponse;
          do {
            await new Promise(resolve => setTimeout(resolve, 1000));
            resultResponse = await axios.get(
              `https://judge0-ce.p.rapidapi.com/submissions/${submissionToken}`,
              { headers: {
                  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
              }}
            );
          } while (resultResponse.data.status.id <= 2);

          const output = resultResponse.data.stdout ? resultResponse.data.stdout.trim() : "";
          const formattedOutput = output.replace(/\s/g, '');
          const formattedExpectedOutput = testCase.output.replace(/\s/g, '');

          if (formattedOutput !== formattedExpectedOutput) {
            console.log(`[Room ${roomId}] Incorrect solution on input: ${testCase.input}`);
            socket.emit('testResult', { 
              success: false, 
              message: `Failed on test case with input: ${testCase.input}\nExpected: ${testCase.output}, Got: ${output || resultResponse.data.stderr || 'No output'}`
            });
            return;
          }
        }

        console.log(`[Room ${roomId}] Correct solution by ${submittingPlayer.username}. All test cases passed!`);
        await recordBattleOutcome(roomId, submittingPlayer, room.players);
        io.to(roomId).emit('gameOver', { winner: submittingPlayer });
        delete rooms[roomId];

      } catch (error) {
        console.error('--- DETAILED JUDGE0 API ERROR ---', error.response ? error.response.data : error.message);
        socket.emit('testResult', { success: false, message: 'Error executing code.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔥 Client disconnected: ${socket.id}`);
      
      let roomIdToDelete = null;
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerInRoom = room.players.find(p => p.socketId === socket.id);

        if (playerInRoom) {
          if (room.players.length === 2) {
            const winner = room.players.find(p => p.socketId !== socket.id);
            console.log(`[Room ${roomId}] Player disconnected. ${winner.username} wins by forfeit.`);
            recordBattleOutcome(roomId, winner, room.players);
            io.to(winner.socketId).emit('opponentLeft', { winner });
          }
          roomIdToDelete = roomId;
          break;
        }
      }
      if (roomIdToDelete) {
        delete rooms[roomIdToDelete];
        console.log(`[Room ${roomIdToDelete}] Cleaned up after disconnect.`);
      }
    });
  });
}

module.exports = { initializeSocket };

