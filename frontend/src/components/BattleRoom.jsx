import { useState, useEffect } from 'react';
import { socket } from '../App';
import { ThemedPanel, ThemedButton } from './ThemedComponents';
import Editor from '@monaco-editor/react';

export const BattleRoom = ({ problem, roomId, userProfile }) => {
  const params = problem.parameters.join(', ');
  const defaultCode = `# Your code here...\ndef ${problem.functionName}(${params}):\n\tpass`;
  
  const [code, setCode] = useState(defaultCode);
  const [result, setResult] = useState('');
  const [winner, setWinner] = useState(null);
  const [gameOverReason, setGameOverReason] = useState(''); // To track how the game ended

  useEffect(() => {
    // Handler for a normal win
    const onGameOver = ({ winner }) => {
      setWinner(winner);
      setGameOverReason('solution');
    };

    // Handler for a win by forfeit
    const onOpponentLeft = ({ winner }) => {
      setWinner(winner);
      setGameOverReason('forfeit');
    };
    
    // Listen for both events
    socket.on('gameOver', onGameOver);
    socket.on('opponentLeft', onOpponentLeft);
    socket.on('testResult', ({ message }) => setResult(message));
    
    return () => {
      socket.off('gameOver', onGameOver);
      socket.off('opponentLeft', onOpponentLeft);
      socket.off('testResult');
    };
  }, []);

  const handleSubmit = () => {
    if (!roomId) return alert("No Room ID found!");
    socket.emit('submitCode', { roomId, code });
  };

  if (winner) {
    // FIX: Use optional chaining (?.) to prevent crash if userProfile is not yet loaded
    const isWinner = winner.uid === userProfile?.uid; 
    let title = '';
    
    if (isWinner) {
      // Show a different message depending on how the game was won
      title = gameOverReason === 'forfeit' ? 'Opponent Left, You Win!' : '🎉 Victory! 🎉';
    } else {
      title = 'Defeat';
    }

    return (
      <ThemedPanel className="max-w-2xl mx-auto text-center">
        <h2 className="text-5xl mb-4">{title}</h2>
        {/* Display the winner's username */}
        <p className="text-2xl">The winner is: <span className="text-clash-secondary">{winner.username || winner.email}</span></p>
        <ThemedButton onClick={() => window.location.reload()} className="mt-8">
          Play Again
        </ThemedButton>
      </ThemedPanel>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ThemedPanel className="mb-6 text-left">
        <h2 className="text-3xl text-clash-secondary mb-2">{problem?.title}</h2>
        <p className="text-clash-text/80 text-lg mb-4 whitespace-pre-wrap">{problem?.description}</p>
        
        {/* Problem details sections */}
        <div className="space-y-4 text-clash-text/90">
          <div>
            <h3 className="font-bold text-xl text-clash-secondary">User Task:</h3>
            <p className="whitespace-pre-wrap">{problem?.userTask}</p>
          </div>
          <div>
            <h3 className="font-bold text-xl text-clash-secondary">Input:</h3>
            <p className="whitespace-pre-wrap">{problem?.inputFormat}</p>
          </div>
          <div>
            <h3 className="font-bold text-xl text-clash-secondary">Output:</h3>
            <p className="whitespace-pre-wrap">{problem?.outputFormat}</p>
          </div>
          
          {problem?.examples.map((example, index) => (
            <div key={index}>
              <h3 className="font-bold text-xl text-clash-secondary">Example {index + 1}:</h3>
              <pre className="bg-stone-900/50 p-3 rounded-md text-clash-text/90 mt-2">
                <code>
                  <strong>Input:</strong><br/>
                  {example.input}<br/><br/>
                  <strong>Output:</strong><br/>
                  {example.output}
                </code>
              </pre>
            </div>
          ))}
        </div>
      </ThemedPanel>

      <div className="bg-clash-wood p-2 border-8 border-double border-clash-gold/60 rounded-lg shadow-clash-panel">
        <div 
          onPaste={(e) => e.preventDefault()} 
          title="Pasting code is disabled for this challenge."
        >
          <Editor
            height="400px"
            language="python"
            theme="vs-dark"
            defaultValue={defaultCode}
            onChange={(value) => setCode(value)}
            options={{
              fontSize: 16,
              minimap: { enabled: false },
              contextmenu: false,
            }}
          />
        </div>
      </div>
      <ThemedButton onClick={handleSubmit} className="mt-6 w-full text-2xl py-4">
        Submit Code
      </ThemedButton>
      {result && 
        <pre className="mt-4 bg-stone-900/70 border-2 border-clash-accent/50 text-clash-accent p-4 rounded-lg text-left">
          {result}
        </pre>
      }
    </div>
  );
};

