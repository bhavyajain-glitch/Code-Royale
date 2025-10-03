import { useState, useEffect } from 'react';
import { auth } from './firebase'; // Import auth from your new firebase config
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

// We'll manage the socket connection here as well
import { io } from 'socket.io-client';
const socket = io('http://localhost:4000');


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [inRoom, setInRoom] = useState(false);
  const [problem, setProblem] = useState(null)

  // onAuthStateChanged is the core listener for a user's login state.
  // It fires once on page load, and again any time the user logs in or out.
  useEffect(() => {
    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Socket.io connection listeners
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    const onGameStart = (data) => {
      console.log('Game is starting with problem:', data.problem);
      setProblem(data.problem);
      setInRoom(true);
    };

    socket.on('gameStart', onGameStart);

    return () => {
      socket.off('gameStart', onGameStart);
    };
  }, [])

  const handleSignup = async (email, password) => {
    try {
      // Creates a new user account in Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Signup Error:", error.message);
      alert(error.message); // Show error to the user
    }
  };

  const handleLogin = async (email, password) => {
    try {
      // Signs in an existing user
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login Error:", error.message);
      alert(error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // Don't render the main app until we've checked the user's auth status
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // A simple component for the Authentication page
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
    )
  }
  
  // A simple placeholder for the main application content after login
  const HomePage = () => {
    const [roomIdInput, setRoomIdInput] = useState('');

    const handleCreateRoom = async () => {
      if (!auth.currentUser) return alert('You must be logged in!');

      // Get the Firebase ID token for the current user.
      // This token securely proves the user's identity to our backend.
      const idToken = await auth.currentUser.getIdToken();

      socket.emit('createRoom', { idToken });

      // Listen for the server's confirmation that the room was created
      socket.on('roomCreated', ({ roomId }) => {
        alert(`Room created! Your Room ID is: ${roomId}\nShare it with a friend.`);
        setRoomIdInput(roomId);
      });
    };

    const handleJoinRoom = async () => {
      if (!auth.currentUser) return alert('You must be logged in!');
      if (roomIdInput.trim() === '') return alert('Please enter a Room ID.');

      const idToken = await auth.currentUser.getIdToken();
      socket.emit('joinRoom', { idToken, roomId: roomIdInput });
    };

    return (
      <div>
        <h3>Welcome, {user.email}</h3>
        <p>Server Connection: {isConnected ? '✅' : '❌'}</p>
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

  const BattleRoom = () => (
    <div>
      <h2>Battle Room</h2>
      <h3>Problem: {problem?.title}</h3>
      <p>{problem?.description}</p>
    </div>
  );

  // Main return statement for the App component
  return (
    <div className="App">
      <h1>Code Battle</h1>
      {!user 
        ? <AuthPage /> 
        : inRoom 
          ? <BattleRoom /> 
          : <HomePage />
      }
    </div>
  );
}

export default App;