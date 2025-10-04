import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // Import auth and db from your firebase config
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import axios from 'axios'; // Added for leaderboard API calls

// Socket.io and Code Editor Imports
import { io } from 'socket.io-client';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css'; // A nice dark theme for the editor

const socket = io('http://localhost:4000');


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  // State Management
  const [inRoom, setInRoom] = useState(false);
  const [problem, setProblem] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [view, setView] = useState('home'); // 'home' or 'leaderboard'

  useEffect(() => {
    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Socket.io connection listeners
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    const onRoomCreated = ({ roomId }) => {
      alert(`Room created! Your Room ID is: ${roomId}\nShare it with a friend.`);
      setRoomId(roomId);
    };
    socket.on('roomCreated', onRoomCreated);

    const onGameStart = (data) => {
      console.log('Game is starting with problem:', data.problem);
      setProblem(data.problem);
      setView('home'); // Ensure view returns to home when a game starts
      setInRoom(true);
    };
    socket.on('gameStart', onGameStart);

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameStart', onGameStart);
      socket.off('roomCreated', onRoomCreated);
    };
  }, []);

  const handleSignup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        score: 0
      });
    } catch (error) {
      console.error("Signup Error:", error.message);
      alert(error.message);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login Error:", error.message);
      alert(error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  
  // --- Child Components ---

  const AuthPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    return (
        <div>
            <h2>Welcome to Code Battle</h2>
            <p>Please Sign Up or Log In</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button onClick={() => handleSignup(email, password)}>Sign Up</button>
            <button onClick={() => handleLogin(email, password)}>Log In</button>
        </div>
    );
  };
  
  const HomePage = () => {
    const [roomIdInput, setRoomIdInput] = useState('');

    const handleCreateRoom = async () => {
      if (!auth.currentUser) return alert('You must be logged in!');
      const idToken = await auth.currentUser.getIdToken();
      socket.emit('createRoom', { idToken });
    };

    const handleJoinRoom = async () => {
      if (!auth.currentUser) return alert('You must be logged in!');
      if (roomIdInput.trim() === '') return alert('Please enter a Room ID.');
      const idToken = await auth.currentUser.getIdToken();
      setRoomId(roomIdInput);
      socket.emit('joinRoom', { idToken, roomId: roomIdInput });
    };

    useEffect(() => {
        if (roomId) setRoomIdInput(roomId);
    }, [roomId]);

    return (
      <div>
        <h3>Welcome, {user.email}</h3>
        <p>Server Connection: {isConnected ? '✅' : '❌'}</p>
        <button onClick={() => setView('leaderboard')}>View Leaderboard</button>
        <button onClick={handleLogout}>Log Out</button>
        <hr />
        <div>
          <h3>Start a Battle</h3>
          <button onClick={handleCreateRoom}>Create New Room</button>
          <br />
          <p>OR</p>
          <input 
            type="text" 
            placeholder="Enter Room ID" 
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      </div>
    );
  };

  // In frontend/src/App.jsx

const BattleRoom = ({ problem, roomId }) => {
  // --- DYNAMIC TEMPLATE FIX ---
  // Generate the function signature from the problem's parameter list
  const params = problem.parameters.join(', ');
  const [code, setCode] = useState(`# Your code here...\ndef ${problem.functionName}(${params}):\n\tpass`);
  // --- END FIX ---

  const [result, setResult] = useState('');
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const onGameOver = ({ winner }) => setWinner(winner);
    const onTestResult = ({ message }) => setResult(message);
    
    socket.on('gameOver', onGameOver);
    socket.on('testResult', onTestResult);
    
    return () => {
      socket.off('gameOver', onGameOver);
      socket.off('testResult', onTestResult);
    };
  }, []);

  const handleSubmit = () => {
    if (!roomId) return alert("No Room ID found!");
    socket.emit('submitCode', { roomId, code });
  };

  if (winner) {
    const isWinner = winner.uid === auth.currentUser.uid;
    return (
      <div>
        <h2>Game Over!</h2>
        <h3>{isWinner ? "🎉 You Won! 🎉" : "You Lost"}</h3>
        <p>Winner: {winner.email}</p>
        <button onClick={() => window.location.reload()}>Play Again</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{problem?.title}</h2>
      <p>{problem?.description}</p>
      <Editor
        value={code}
        onValueChange={code => setCode(code)}
        highlight={code => highlight(code, languages.python)}
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: '#2d2d2d',
          color: '#f8f8f2',
          minHeight: '300px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />
      <button onClick={handleSubmit} style={{marginTop: '10px'}}>Submit Code</button>
      {result && <pre style={{backgroundColor: '#333', color: 'orange', padding: '10px'}}>Result: {result}</pre>}
    </div>
  );
};
  
  // --- NEW: Leaderboard Component ---
  const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
      axios.get('http://localhost:4000/api/leaderboard')
        .then(response => {
          setLeaderboard(response.data);
        })
        .catch(err => {
          console.error("Failed to fetch leaderboard:", err);
          setError('Could not load leaderboard.');
        });
    }, []);

    return (
      <div>
        <h2>🏆 Top Players 🏆</h2>
        <button onClick={() => setView('home')}>Back to Home</button>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <ol>
          {leaderboard.map((player) => (
            <li key={player.id}>
              {player.email} - <strong>{player.score} points</strong>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  // --- Main Return Logic ---
  const renderView = () => {
    if (inRoom) {
      return <BattleRoom problem={problem} roomId={roomId} />;
    }
    if (view === 'leaderboard') {
      return <LeaderboardPage />;
    }
    return <HomePage />;
  };

  return (
    <div className="App">
      <h1>Code Battle</h1>
      {!user ? <AuthPage /> : renderView()}
    </div>
  );
}

export default App;