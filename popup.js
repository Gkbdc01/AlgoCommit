document.addEventListener('DOMContentLoaded', () => {
  // Select all the HTML elements we need to interact with
  const loginView = document.getElementById('login-view');
  const mainView = document.getElementById('main-view');
  const loginButton = document.getElementById('login-button');
  const pushButton = document.getElementById('push-button');
  const solutionQueueUl = document.getElementById('solution-queue');
  const statusDiv = document.getElementById('status');

  // This function refreshes the list of solutions in the UI
  const updateQueueList = () => {
    chrome.storage.local.get(['solution_queue'], (result) => {
      const queue = result.solution_queue || [];
      solutionQueueUl.innerHTML = ''; // Clear the current list
      if (queue.length === 0) {
        solutionQueueUl.innerHTML = '<li>No solutions in queue.</li>';
        pushButton.disabled = true; // Disable button if queue is empty
      } else {
        queue.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.title;
          solutionQueueUl.appendChild(li);
        });
        pushButton.disabled = false; // Enable button if queue has items
      }
    });
  };

  // Check login status as soon as the popup opens
  chrome.storage.local.get(['github_token'], (result) => {
    if (result.github_token) {
      loginView.style.display = 'none';
      mainView.style.display = 'block';
      updateQueueList();
    } else {
      loginView.style.display = 'block';
      mainView.style.display = 'none';
    }
  });

  // --- Event Listeners ---

  // Handle the Login button click
  loginButton.addEventListener('click', () => {
    const token = prompt("For the MVP, please generate a GitHub Personal Access Token (Classic) with the 'repo' scope and paste it here:");
    if (token) {
      chrome.storage.local.set({ github_token: token }, () => {
        console.log('AlgoCommit: GitHub token stored.');
        // Switch to the main view
        loginView.style.display = 'none';
        mainView.style.display = 'block';
        updateQueueList();
      });
    }
  });

  // Handle the Push to GitHub button click
  pushButton.addEventListener('click', () => {
    // ===================================================================
    // IMPORTANT: EDIT THESE VALUES FOR YOUR TEST!
    // ===================================================================
    const owner = 'Gkbdc01'; // <-- REPLACE THIS
    const repo = 'testing';       // <-- REPLACE THIS (e.g., 'LeetCode-Solutions')
    
    if (owner === 'YOUR_GITHUB_USERNAME' || repo === 'YOUR_REPO_NAME') {
        statusDiv.textContent = 'Error: Please update owner/repo in popup.js';
        statusDiv.style.color = 'red';
        return;
    }
      
    statusDiv.textContent = 'Pushing solutions...';
    statusDiv.style.color = 'black';
    pushButton.disabled = true;

    // Send a message to the background script to start the push process
    chrome.runtime.sendMessage({ action: 'push', owner, repo }, (response) => {
      if (response && response.success) {
        statusDiv.textContent = 'Successfully pushed to GitHub!';
        statusDiv.style.color = 'green';
        // Refresh the list (which should now be empty) after a short delay
        setTimeout(updateQueueList, 2000); 
      } else {
        statusDiv.textContent = `Error: ${response ? response.error : 'Unknown error'}`;
        statusDiv.style.color = 'red';
      }
      // Re-enable the button, unless the queue is now empty
      if ((solutionQueueUl.children.length > 0 && solutionQueueUl.children[0].textContent !== 'No solutions in queue.')) {
        pushButton.disabled = false;
      }
    });
  });
});