import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView.jsx';
import QueueView from './components/QueueView.jsx';
import SetupView from './components/SetupView.jsx';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [solutionQueue, setSolutionQueue] = useState([]);

  useEffect(() => {
    chrome.storage.local.get(['github_token', 'github_owner', 'github_repo', 'github_folder', 'solution_queue'], (result) => {
      setIsLoggedIn(!!result.github_token);
      setIsConfigured(!!result.github_owner && !!result.github_repo);
      setSolutionQueue(result.solution_queue || []);
    });
    
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes.solution_queue) {
        setSolutionQueue(changes.solution_queue.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleLogin = () => {
    const token = prompt("Please enter your GitHub Personal Access Token with 'repo' scope:");
    if (token) {
      chrome.storage.local.set({ github_token: token }, () => setIsLoggedIn(true));
    }
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['github_token', 'github_owner', 'github_repo', 'github_folder'], () => {
      setIsLoggedIn(false);
      setIsConfigured(false);
    });
  };

  const handleSaveSettings = ({ owner, repo, folder }) => {
    chrome.storage.local.set({ github_owner: owner, github_repo: repo, github_folder: folder }, () => {
      setIsConfigured(true);
      setIsEditing(false);
    });
  };
  
  const handleEditSettings = () => {
    setIsEditing(true);
  };

  const renderContent = () => {
    if (!isLoggedIn) return <LoginView onLogin={handleLogin} />;
    if (!isConfigured || isEditing) return <SetupView onSave={handleSaveSettings} />;
    return <QueueView solutionQueue={solutionQueue} onLogout={handleLogout} onEditSettings={handleEditSettings} />;
  };

  return (
    <div className="container">
      <div className="header">
        <img src="/icons/icon48.png" alt="AlgoCommit Logo" width="32" height="32" />
        <h1 className="title">AlgoCommit</h1>
      </div>
      {renderContent()}
    </div>
  );
}

export default App;