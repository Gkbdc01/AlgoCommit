import React, { useState } from 'react';

const QueueView = ({ solutionQueue }) => {
  const [status, setStatus] = useState(''); // To show messages like "Pushing..."

  const handlePush = () => {
    setStatus('Pushing...');

    // IMPORTANT: Replace these with your actual GitHub details
    const owner = 'YOUR_GITHUB_USERNAME';
    const repo = 'YOUR_REPO_NAME';

    chrome.runtime.sendMessage(
      { action: 'push_to_github', data: { owner, repo } },
      (response) => {
        if (response && response.status === 'success') {
          setStatus('Successfully pushed!');
        } else {
          setStatus(response ? response.message : 'An unknown error occurred.');
        }
        // Clear the status message after a few seconds
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
      <button className="button" onClick={handlePush} disabled={status === 'Pushing...'}>
        {status || 'Push Session to GitHub'}
      </button>
    </div>
  );
};

export default QueueView;