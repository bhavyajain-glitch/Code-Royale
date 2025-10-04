import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { io } from 'socket.io-client';

// Import your components
import { AuthPage } from './components/AuthPage';
import { HomePage } from './components/HomePage';
import { BattleRoom } from './components/BattleRoom';
import { LeaderboardPage } from './components/LeaderboardPage';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
export const socket = io(SERVER_URL);

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // State for Firestore profile
  const [loading, setLoading] = useState(true);
  const [inRoom, setInRoom] = useState(false);
  const [problem, setProblem] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [view, setView] = useState('home');

  useEffect(() => {
    // This effect now handles fetching the user's profile
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // User is logged in, fetch their profile from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          console.log("No such user profile in Firestore!");
        }
      } else {
        // User is logged out, clear the profile
        setUserProfile(null);
      }
      
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

  // Updated to pass the userProfile object to child components
  const renderView = () => {
    if (inRoom) {
      return <BattleRoom problem={problem} roomId={roomId} userProfile={userProfile} />;
    }
    if (view === 'leaderboard') {
      return <LeaderboardPage setView={setView} serverUrl={SERVER_URL} />;
    }
    return <HomePage userProfile={userProfile} setView={setView} setRoomId={setRoomId} />;
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