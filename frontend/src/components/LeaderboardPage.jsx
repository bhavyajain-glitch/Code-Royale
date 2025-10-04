import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemedPanel, ThemedButton } from './ThemedComponents';
import { FaCrown, FaShieldAlt } from 'react-icons/fa';

const LeaderboardItem = ({ player, rank }) => {
  const rankColor = 
    rank === 1 ? 'text-yellow-400' :
    rank === 2 ? 'text-gray-300' :
    rank === 3 ? 'text-amber-600' : 'text-clash-text/70';

  return (
    <div className="flex items-center bg-clash-primary/50 hover:bg-clash-primary/80 transition-colors p-3 rounded-lg mb-2 border-2 border-clash-secondary/20">
      <span className={`text-2xl font-black w-12 ${rankColor}`}>#{rank}</span>
      <div className="flex-shrink-0 mr-4 text-xl">
        {rank <= 3 ? <FaCrown className={rankColor} /> : <FaShieldAlt className={rankColor} />}
      </div>
      <span className="flex-grow text-xl text-white">{player.email}</span>
      <span className="text-xl font-bold text-clash-secondary">{player.score} pts</span>
    </div>
  );
};

export const LeaderboardPage = ({ setView, serverUrl }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${serverUrl}/api/leaderboard`)
      .then(response => {
        setLeaderboard(response.data);
      })
      .catch(err => {
        setError('Could not load leaderboard.');
      });
  }, [serverUrl]);

  return (
    <ThemedPanel className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl text-clash-secondary">Royal Rankings</h2>
        <ThemedButton onClick={() => setView('home')} className="text-lg py-2">
          Back
        </ThemedButton>
      </div>
      {error && <p className="text-clash-accent">{error}</p>}
      <div className="flex flex-col gap-2">
        {leaderboard.map((player, index) => (
          <LeaderboardItem key={player.id} player={player} rank={index + 1} />
        ))}
      </div>
    </ThemedPanel>
  );
};