import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ThemedPanel, ThemedButton } from './ThemedComponents';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        score: 0,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <ThemedPanel className="max-w-md mx-auto">
      <h2 className="text-3xl text-center text-clash-secondary mb-6">Welcome to the Arena</h2>
      <div className="flex flex-col gap-4">
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Enter your Email"
          className="bg-stone-900/50 border-2 border-clash-gold/50 rounded-lg text-center p-3 text-lg" 
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter your Password"
          className="bg-stone-900/50 border-2 border-clash-gold/50 rounded-lg text-center p-3 text-lg"
        />
        <div className="flex gap-4 mt-4">
          <ThemedButton onClick={handleSignup} className="w-full">Sign Up</ThemedButton>
          <ThemedButton onClick={handleLogin} className="w-full">Log In</ThemedButton>
        </div>
      </div>
    </ThemedPanel>
  );
};