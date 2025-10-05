import React, { useState } from 'react';

const SetupView = ({ onSave }) => {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [folder, setFolder] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    if (!owner || !repo) {
      alert('Please fill in GitHub Username and Repository Name.');
      return;
    }
    setIsLoading(true);
    setStatus('Verifying repository...');
    chrome.runtime.sendMessage(
      { action: 'ensure_repo', data: { owner, repo } },
      (response) => {
        setIsLoading(false);
        if (response && response.status === 'success') {
          setStatus(response.message);
          setTimeout(() => {
            onSave({ owner, repo, folder });
          }, 1500);
        } else {
          setStatus(response ? response.message : 'An unknown error occurred.');
        }
      }
    );
  };

  return (
    <div>
      <h2>GitHub Setup</h2>
      <p>Enter your details. If the repository doesn't exist, we'll create it for you.</p>
      
      <div className="form-group">
        <label htmlFor="owner">GitHub Username</label>
        <input type="text" id="owner" className="input-field" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g., octocat" disabled={isLoading} />
      </div>
      <div className="form-group">
        <label htmlFor="repo">Repository Name</label>
        <input type="text" id="repo" className="input-field" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="e.g., LeetCode-Solutions" disabled={isLoading} />
      </div>

      <div className="form-group">
        <label htmlFor="folder">Folder Name (Optional)</label>
        <input
          type="text"
          id="folder"
          className="input-field"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="e.g., Python-Solutions"
          disabled={isLoading}
        />
      </div>

      <button className="button" onClick={handleSave} disabled={isLoading}>
        {isLoading ? 'Verifying...' : 'Save and Continue'}
      </button>
      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default SetupView;