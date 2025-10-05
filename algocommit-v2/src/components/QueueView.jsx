import React, { useState, useEffect } from 'react';

// Now accepts onRemove prop
const QueueView = ({ solutionQueue, onLogout, onEditSettings, onRemove }) => {
  const [status, setStatus] = useState('');
  const [repoPath, setRepoPath] = useState('Loading...');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    // We now ask for 'github_folder' as well
    chrome.storage.local.get(['github_owner', 'github_repo', 'github_folder'], (result) => {
      if (result.github_owner && result.github_repo) {
        let path = `${result.github_owner}/${result.github_repo}`;
        // If a folder exists, add it to the path
        if (result.github_folder) {
          path += `/${result.github_folder}`;
        }
        setRepoPath(path);
      } else {
        setRepoPath('Not configured');
      }
    });
  }, []);

  const handleSelection = (index) => {
    const newSelection = new Set(selected);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelected(newSelection);
  };

  const handlePush = async () => {
    if (selected.size === 0) {
      setStatus('Please select items to push.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    setStatus('Pushing...');
    const { github_owner, github_repo } = await chrome.storage.local.get(['github_owner', 'github_repo']);
    const selectedSolutions = solutionQueue.filter((_, index) => selected.has(index));
    chrome.runtime.sendMessage(
      { 
        action: 'push_selected_to_github', 
        data: { 
          owner: github_owner, 
          repo: github_repo,
          solutions: selectedSolutions
        } 
      },
      (response) => {
        setStatus(response ? response.message : 'An unknown error occurred.');
        setSelected(new Set());
        setTimeout(() => setStatus(''), 3000);
      }
    );
  };

  return (
    <div>
      {/* The settings icon has been removed from here */}
      <h2>Queued Solutions</h2>

      <ul className="queue-list">
        {solutionQueue.length > 0 ? (
          solutionQueue.map((item, index) => (
            <li key={index} className="list-item selectable">
              <input 
                type="checkbox"
                checked={selected.has(index)}
                onChange={() => handleSelection(index)}
              />
              <span className="item-title">{item.title}</span>
              {/* New remove button for each item */}
              <button onClick={() => onRemove(index)} className="remove-button" title="Remove Item">
                🗑️
              </button>
            </li>
          ))
        ) : (
          <li className="list-item">No solutions in queue.</li>
        )}
      </ul>

      <div className="actions">
        {/* ... buttons are the same ... */}
      </div>
      <div className="repo-path">
        Pushing to: <button onClick={onEditSettings} className="link-button">{repoPath}</button>
      </div>
    </div>
  );
};

export default QueueView;