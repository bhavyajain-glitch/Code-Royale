import { useState, useEffect } from "react";
import {io} from "socket.io-client";

const socket = io("http://localhost:4000");

function App() {
  useEffect(() => {
    // Listener for the 'connect' event
    function onConnect() {
      setIsConnected(true);
      console.log('Connected to socket server!');
    }

    // Listener for the 'disconnect' event
    function onDisconnect() {
      setIsConnected(false);
      console.log('Disconnected from socket server.');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Clean up the event listeners on component unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <div className="App">
      <h1>Code Battle</h1>
      <p>Server Connection Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
    </div>
  );
}

export default App;