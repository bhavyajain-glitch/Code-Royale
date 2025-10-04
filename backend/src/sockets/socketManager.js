const { auth } = require('../services/firebaseAdmin');
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

    // createRoom and joinRoom handlers are unchanged.
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
      if (!room) {
        return socket.emit('error', { message: 'Room does not exist.' });
      }
      const playerAlreadyInRoom = room.players.some(player => player.uid === decodedToken.uid);
      if (playerAlreadyInRoom) {
        console.log(`[Room ${roomId}] ${decodedToken.email} is already in this room.`);
        return;
      }
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
    
    // --- UPDATED Code Submission Handler for Multiple Test Cases ---
    socket.on('submitCode', async ({ roomId, code }) => {
      const room = rooms[roomId];
      if (!room || !room.problem) return;
      
      const submittingPlayer = room.players.find(p => p.socketId === socket.id);
      if (!submittingPlayer) return;
      
      console.log(`[Room ${roomId}] Code submission from ${submittingPlayer.email}`);
      const problem = room.problem;

      try {
        // Loop through each test case for the problem.
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

          // If any test case fails, stop and notify the user.
          if (formattedOutput !== formattedExpectedOutput) {
            console.log(`[Room ${roomId}] Incorrect solution on input: ${testCase.input}`);
            socket.emit('testResult', { 
              success: false, 
              message: `Failed on test case with input: ${testCase.input}\nExpected: ${testCase.output}, Got: ${output || resultResponse.data.stderr || 'No output'}`
            });
            return; // Exit the function early on failure.
          }
        }

        // If the loop completes, it means all test cases passed.
        console.log(`[Room ${roomId}] Correct solution by ${submittingPlayer.email}. All test cases passed!`);
        await recordBattleOutcome(roomId, submittingPlayer, room.players);
        io.to(roomId).emit('gameOver', { winner: submittingPlayer });
        delete rooms[roomId]; // Clean up the room from memory.

      } catch (error) {
        console.error('Error with Judge0 API:', error.response ? error.response.data : error.message);
        socket.emit('testResult', { success: false, message: 'Error executing code.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔥 Client disconnected: ${socket.id}`);
      // TODO: Add logic to handle a player disconnecting from a room mid-game.
    });
  });
}

module.exports = { initializeSocket };