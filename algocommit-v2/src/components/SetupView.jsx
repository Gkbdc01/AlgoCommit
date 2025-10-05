import React, { useState, useEffect } from 'react';

// This component is now only for setting up the repository.
const SetupView = ({ onSave, onCancel }) => {
  const [owner, setOwner] = useState(''); // We still need it for the API call
  const [repo, setRepo] = useState('');
  const [folder, setFolder] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get the owner's name from storage to use for validation.
  useEffect(() => {
    chrome.storage.local.get('github_owner', (result) => {
      if (result.github_owner) setOwner(result.github_owner);
    });
  }, []);

  const handleSave = () => {
    if (!repo) return alert('Please provide a repository name.');
    setIsLoading(true);
    setStatus('Verifying repository...');
    chrome.runtime.sendMessage(
      { action: 'ensure_repo', data: { owner, repo } },
      (response) => {
        setIsLoading(false);
        if (response && response.status === 'success') {
          setStatus(response.message);
          setTimeout(() => onSave({ repo, folder }), 1500);
        } else {
          setStatus(response ? response.message : 'An unknown error occurred.');
        }
      }
    );
  };

  return (
    <div>
      <h2>Repository Setup</h2>
      <p>Choose a repository and folder for your solutions. The repository will be created if it doesn't exist.</p>
      <div className="form-group">
        <label htmlFor="repo">Repository Name</label>
        <input type="text" id="repo" className="input-field" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="e.g., LeetCode-Solutions" disabled={isLoading} />
      </div>
      <div className="form-group">
        <label htmlFor="folder">Folder Name (Optional)</label>
        <input type="text" id="folder" className="input-field" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="e.g., Python-Solutions" disabled={isLoading} />
      </div>
      <div className="actions">
        <button className="button" onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Save and Continue'}
        </button>
        {onCancel && (
          <button className="button-secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>
      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default SetupView;