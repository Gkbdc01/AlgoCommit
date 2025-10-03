import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import QueueView from './components/QueueView';
import './App.css';

function App() {
  // State to hold the queue and login status
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Default to false
  const [solutionQueue, setSolutionQueue] = useState([]);

  // useEffect runs once when the component first loads
  useEffect(() => {
    // Fetch the initial queue from storage
    chrome.storage.local.get(['solution_queue'], (result) => {
      setSolutionQueue(result.solution_queue || []);
    });

    // Listen for future changes in storage
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes.solution_queue) {
        setSolutionQueue(changes.solution_queue.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Clean up the listener when the component unmounts
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []); // The empty array [] means this effect runs only once on mount

  // For now, we'll manually set this. Later, this will come from storage.
  // TODO: Replace this with real auth logic
  useEffect(() => {
    // Placeholder for checking the token
    setIsLoggedIn(true); 
  }, []);

  return (
    <div className="container">
      <div className="header">
        <img src="icons/icon48.png" alt="AlgoCommit Logo" width="32" height="32" />
        <h1 className="title">AlgoCommit</h1>
      </div>

      {isLoggedIn ? (
        <QueueView solutionQueue={solutionQueue} />
      ) : (
        <LoginView />
      )}
    </div>
  );
}

export default App;