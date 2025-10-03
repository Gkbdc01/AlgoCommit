// This function adds a new solution to our queue in Chrome's local storage.
const addSolutionToQueue = async (solutionData) => {
  // Retrieve the existing queue.
  const result = await chrome.storage.local.get(['solution_queue']);
  const queue = result.solution_queue || [];

  // Add the new solution and save it back.
  queue.push(solutionData);
  await chrome.storage.local.set({ solution_queue: queue });
  
  console.log('AlgoCommit: Solution added to queue. Queue size:', queue.length);
};

// This function pushes all solutions in the queue to the user's GitHub repo.
const pushQueueToGitHub = async (owner, repo) => {
  const { solution_queue, github_token } = await chrome.storage.local.get(['solution_queue', 'github_token']);

  if (!github_token) {
    return { success: false, error: 'GitHub token not found. Please log in.' };
  }
  if (!solution_queue || solution_queue.length === 0) {
    return { success: false, error: 'Solution queue is empty.' };
  }

  // Loop through each solution and commit it individually.
  for (const solution of solution_queue) {
    const fileExtension = getFileExtension(solution.language);
    // Sanitize title to be a valid folder name
    const safeTitle = solution.title.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
    const path = `Leetcode/${safeTitle}.${fileExtension}`;
    const message = `feat: Solve LeetCode problem '${solution.title}'`;

    // Content must be Base64 encoded for the GitHub API.
    const content = btoa(unescape(encodeURIComponent(solution.code)));

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${github_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        // The GitHub API requires the message and content in the body.
        // For existing files, it would also need a 'sha', but we'll keep it simple for MVP.
        body: JSON.stringify({ message, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // A common error is the file already exists. We'll report it.
        throw new Error(`GitHub API Error for '${solution.title}': ${errorData.message}`);
      }
      console.log(`AlgoCommit: Successfully pushed ${solution.title}`);
    } catch (error) {
      console.error('AlgoCommit: Error during fetch to GitHub API.', error);
      // If one file fails, we stop and report the error.
      return { success: false, error: error.message };
    }
  }

  // If all pushes were successful, clear the queue.
  await chrome.storage.local.set({ solution_queue: [] });
  return { success: true };
};

// Helper function to get the correct file extension for a given language.
const getFileExtension = (language) => {
  const langMap = {
    'JavaScript': 'js', 'Python': 'py', 'Java': 'java', 'C++': 'cpp', 'TypeScript': 'ts', 'Go': 'go', 'SQL': 'sql'
  };
  return langMap[language] || 'txt';
};

// This is the main event listener for the extension. It's the "ears."
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'new_solution') {
    addSolutionToQueue(request.data);
  } else if (request.action === 'push') {
    // We must return true to indicate we will send a response asynchronously.
    pushQueueToGitHub(request.owner, request.repo)
      .then(response => sendResponse(response));
    return true;
  }
  // We will handle the 'login' action in the popup.js for the PAT method.
});