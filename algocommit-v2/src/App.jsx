import React from 'react';
import LoginView from './components/LoginView';
import QueueView from './components/QueueView';
import './App.css'; // Import the stylesheet

function App() {
  const isLoggedIn = true; 
  const solutionQueue = ["Two Sum", "Palindrome Number"];

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