import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ThemedPanel, ThemedButton } from './ThemedComponents';

export const AuthPage = () => {
  // State to toggle between 'login' and 'signup' modes
  const [authMode, setAuthMode] = useState('login'); 
  
  // States for form inputs
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- Logic Functions (unchanged) ---
  const handleSignup = async () => {
    if (!signupUsername || !signupEmail || !signupPassword) return alert("Please fill in all fields.");
    const usersRef = collection(db, "users");
    const q = query(users-ref, where("username", "==", signupUsername));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) return alert("This username is already taken.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        username: signupUsername,
        email: signupEmail,
        score: 0,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async () => {
    if (!loginIdentifier || !loginPassword) return alert("Please provide your username/email and password.");
    let userEmail = loginIdentifier;
    if (!loginIdentifier.includes('@')) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", loginIdentifier), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return alert("User not found.");
      userEmail = querySnapshot.docs[0].data().email;
    }
    try {
      await signInWithEmailAndPassword(auth, userEmail, loginPassword);
    } catch (error) {
      alert("Invalid credentials.");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {authMode === 'login' ? (
        // --- LOGIN VIEW ---
        <ThemedPanel>
          <h2 className="text-3xl text-center text-clash-secondary mb-6">Return to Battle</h2>
          <div className="flex flex-col gap-4">
            <input type="text" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} placeholder="Username or Email" className="input-field" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className="input-field" />
            <ThemedButton onClick={handleLogin} className="mt-4">Log In</ThemedButton>
            <button 
              onClick={() => setAuthMode('signup')}
              className="w-full mt-4 bg-transparent text-clash-secondary hover:underline"
            >
              Don't have an account? Sign Up
            </button>
          </div>
        </ThemedPanel>
      ) : (
        // --- SIGNUP VIEW ---
        <ThemedPanel>
          <h2 className="text-3xl text-center text-clash-secondary mb-6">Join the Arena</h2>
          <div className="flex flex-col gap-4">
            <input type="text" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} placeholder="Choose a Username" className="input-field" />
            <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="Enter your Email" className="input-field" />
            <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Create a Password" className="input-field" />
            <ThemedButton onClick={handleSignup} className="mt-4">Create Account</ThemedButton>
            <button 
              onClick={() => setAuthMode('login')}
              className="w-full mt-4 bg-transparent text-clash-secondary hover:underline"
            >
              Already have an account? Log In
            </button>
          </div>
        </ThemedPanel>
      )}
    </div>
  );
};