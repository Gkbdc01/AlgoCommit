import React from 'react';

const QueueView = ({ solutionQueue }) => {
  return (
    <div>
      <h2>Queued Solutions</h2>
      {/* Changed 'style' to 'className' */}
      <ul className="queue-list">
        {solutionQueue.length > 0 ? (
          solutionQueue.map((item, index) => <li key={index} className="list-item">{item}</li>)
        ) : (
          <li className="list-item">No solutions in queue.</li>
        )}
      </ul>
      {/* Changed 'style' to 'className' */}
      <button className="button">Push Session to GitHub</button>
    </div>
  );
};

export default QueueView;