import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView.jsx';
import QueueView from './components/QueueView.jsx';
import SetupView from './components/SetupView.jsx';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRepoSet, setIsRepoSet] = useState(false);
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [solutionQueue, setSolutionQueue] = useState([]);

  useEffect(() => {
    chrome.storage.local.get(['github_token', 'github_repo', 'solution_queue'], (result) => {
      setIsLoggedIn(!!result.github_token);
      setIsRepoSet(!!result.github_repo);
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

  const handleRemoveItem = (indexToRemove) => {
    const newQueue = solutionQueue.filter((_, index) => index !== indexToRemove);
    setSolutionQueue(newQueue);
    chrome.storage.local.set({ solution_queue: newQueue });
  };

  const handleLogin = () => {
    const token = prompt("Please enter your GitHub Personal Access Token with 'repo' scope:");
    if (!token) return;

    chrome.runtime.sendMessage({ action: 'fetch_user', token: token }, (response) => {
      if (response && response.status === 'success') {
        const { username } = response.data;
        chrome.storage.local.set({ github_token: token, github_owner: username }, () => {
          setIsLoggedIn(true);
        });
      } else {
        alert("Login failed: " + (response ? response.message : "Invalid Token or Network Error"));
      }
    });
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['github_token', 'github_owner', 'github_repo', 'github_folder'], () => {
      setIsLoggedIn(false);
      setIsRepoSet(false);
    });
  };

  const handleSaveRepoSettings = ({ repo, folder }) => {
    chrome.storage.local.set({ github_repo: repo, github_folder: folder }, () => {
      setIsRepoSet(true);
      setIsEditingRepo(false);
    });
  };
  
  const handleEditRepoSettings = () => {
    setIsEditingRepo(true);
  };

  const handleCancelEdit = () => {
    setIsEditingRepo(false);
  };

  const renderContent = () => {
    if (!isLoggedIn) return <LoginView onLogin={handleLogin} />;
    if (!isRepoSet || isEditingRepo) {
      const cancelFunc = isEditingRepo ? handleCancelEdit : null;
      return <SetupView onSave={handleSaveRepoSettings} onCancel={cancelFunc} />;
    }
    return <QueueView 
      solutionQueue={solutionQueue} 
      onLogout={handleLogout} 
      onEditSettings={handleEditRepoSettings}
      onRemove={handleRemoveItem} 
    />;
  };

  return (
    <div className="container">
      <div className="header">
        {/* Corrected image path (no leading slash) */}
        <img src="icons/icon48.png" alt="AlgoCommit Logo" width="32" height="32" />
        <h1 className="title">AlgoCommit</h1>
      </div>
      {renderContent()}
    </div>
  );
}

export default App;