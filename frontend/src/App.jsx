import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { io } from 'socket.io-client';
import axios from 'axios';

// Import your new components
import { AuthPage } from './components/AuthPage';
import { HomePage } from './components/HomePage';
import { BattleRoom } from './components/BattleRoom';
import { LeaderboardPage } from './components/LeaderboardPage';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
export const socket = io(SERVER_URL);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inRoom, setInRoom] = useState(false);
  const [problem, setProblem] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [view, setView] = useState('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    const onGameStart = (data) => {
      setProblem(data.problem);
      setView('home');
      setInRoom(true);
    };
    socket.on('gameStart', onGameStart);

    return () => {
      unsubscribe();
      socket.off('gameStart', onGameStart);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderView = () => {
    if (inRoom) {
      return <BattleRoom problem={problem} roomId={roomId} user={user} />;
    }
    if (view === 'leaderboard') {
      return <LeaderboardPage setView={setView} serverUrl={SERVER_URL} />;
    }
    return <HomePage user={user} setView={setView} setRoomId={setRoomId} />;
  };

  return (
    <div className="App min-h-screen p-4">
      <h1 className="text-5xl md:text-6xl text-clash-secondary mb-8 font-black" style={{ WebkitTextStroke: '2px black' }}>
        Code Royale
      </h1>
      {!user ? <AuthPage /> : renderView()}
    </div>
  );
}

export default App;