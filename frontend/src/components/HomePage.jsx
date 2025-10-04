import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth'; // Corrected import
import { socket } from '../App';
import { ThemedPanel, ThemedButton } from './ThemedComponents';
import { FaCrown } from 'react-icons/fa';

export const HomePage = ({ user, setView, setRoomId }) => {
  const [roomIdInput, setRoomIdInput] = useState('');

  useEffect(() => {
    const onRoomCreated = ({ roomId }) => {
      alert(`Room created! Your Room ID is: ${roomId}\nShare it with a friend.`);
      setRoomId(roomId);
      setRoomIdInput(roomId);
    };
    socket.on('roomCreated', onRoomCreated);
    return () => socket.off('roomCreated', onRoomCreated);
  }, [setRoomId]);

  const handleCreateRoom = async () => {
    const idToken = await auth.currentUser.getIdToken();
    socket.emit('createRoom', { idToken });
  };

  const handleJoinRoom = async () => {
    if (roomIdInput.trim() === '') return;
    const idToken = await auth.currentUser.getIdToken();
    setRoomId(roomIdInput);
    socket.emit('joinRoom', { idToken, roomId: roomIdInput });
  };

  return (
    <ThemedPanel className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl">Welcome, {user.email}</h3>
        <div>
          <ThemedButton onClick={() => setView('leaderboard')} className="text-lg py-2 mr-4">
            <FaCrown className="inline mr-2" />
            Rankings
          </ThemedButton>
          <ThemedButton onClick={() => signOut(auth)} className="text-lg py-2 bg-clash-accent">
            Log Out
          </ThemedButton>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-around mt-8">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl">Your Kingdom</h2>
          <ThemedButton onClick={handleCreateRoom}>Create Battle</ThemedButton>
        </div>
        
        <div className="text-5xl text-clash-accent font-black my-6 md:my-0">VS</div>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl">Opponent's Realm</h2>
          <input 
            type="text" 
            placeholder="Enter Room ID"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            className="bg-stone-900/50 border-2 border-clash-gold/50 rounded-lg text-center p-3 w-48 text-lg"
          />
          <ThemedButton onClick={handleJoinRoom}>Join Battle</ThemedButton>
        </div>
      </div>
    </ThemedPanel>
  );
};