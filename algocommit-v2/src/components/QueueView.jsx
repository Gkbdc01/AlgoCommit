import React, { useState, useEffect } from 'react';

const QueueView = ({ solutionQueue, onLogout, onEditSettings }) => {
  const [status, setStatus] = useState('');
  const [repoPath, setRepoPath] = useState('Loading...');

  useEffect(() => {
    chrome.storage.local.get(['github_owner', 'github_repo'], (result) => {
      if (result.github_owner && result.github_repo) {
        setRepoPath(`${result.github_owner}/${result.github_repo}`);
      } else {
        setRepoPath('Not configured');
      }
    });
  }, [solutionQueue]); // Re-fetch if queue changes, in case settings were changed

  const handlePush = async () => {
    setStatus('Pushing...');
    const { github_owner, github_repo } = await chrome.storage.local.get(['github_owner','github_repo']);
    if (!github_owner || !github_repo) {
      setStatus('Error: GitHub details not set.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    chrome.runtime.sendMessage(
      { action: 'push_to_github', data: { owner: github_owner, repo: github_repo } },
      (response) => {
        setStatus(response ? response.message : 'An unknown error occurred.');
        setTimeout(() => setStatus(''), 3000);
      }
    );
  };

  return (
    <div>
      <h2>Queued Solutions</h2>
      <ul className="queue-list">
        {solutionQueue.length > 0 ? (
          solutionQueue.map((item, index) => <li key={index} className="list-item">{item.title}</li>)
        ) : (
          <li className="list-item">No solutions in queue.</li>
        )}
      </ul>
      <div className="actions">
        <button className="button" onClick={handlePush} disabled={status === 'Pushing...'}>
          {status || 'Push to GitHub'}
        </button>
        <button className="button-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
      <div className="repo-path">
        Pushing to: <button onClick={onEditSettings} className="link-button">{repoPath}</button>
      </div>
    </div>
  );
};

export default QueueView;