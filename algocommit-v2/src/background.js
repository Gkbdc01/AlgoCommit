// src/background.js

function getFileExtension(language) {
  // ... same getFileExtension function as before ...
  const languageMap = { 'python': 'py', 'python3': 'py', 'java': 'java', 'javascript': 'js', 'cpp': 'cpp', 'csharp': 'cs', 'typescript': 'ts', 'golang': 'go', 'ruby': 'rb', 'swift': 'swift', 'kotlin': 'kt', 'scala': 'scala', 'rust': 'rs', 'php': 'php' };
  return languageMap[language.toLowerCase()] || 'txt';
}

async function pushQueueToGitHub(config) {
  const { owner, repo, token } = config;
  const { solution_queue: queue } = await chrome.storage.local.get('solution_queue');

  if (!queue || queue.length === 0) {
    return { status: 'noop', message: 'Queue is empty. Nothing to push.' };
  }

  for (const solution of queue) {
    const fileExtension = getFileExtension(solution.language);
    const safeTitle = solution.title.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
    const path = `${safeTitle}.${fileExtension}`; // Flat file structure
    const message = `feat: Solve LeetCode problem '${solution.title}'`;
    const content = btoa(unescape(encodeURIComponent(solution.code)));

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({ message, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API Error for '${solution.title}': ${errorData.message}`);
      }
    } catch (error) {
      console.error(error);
      return { status: 'error', message: error.message };
    }
  }

  // If all pushes succeed, clear the queue
  await chrome.storage.local.set({ solution_queue: [] });
  return { status: 'success', message: 'Successfully pushed all solutions!' };
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'new_solution') {
    chrome.storage.local.get(['solution_queue'], (result) => {
      const queue = result.solution_queue || [];
      queue.push(request.data);
      chrome.storage.local.set({ solution_queue: queue }, () => {
        console.log('Solution added to the queue.');
        sendResponse({ status: 'success' });
      });
    });
    return true;
  }
  
  if (request.action === 'push_to_github') {
    // We need the token from storage to do this
    chrome.storage.local.get('github_token', (result) => {
        if (result.github_token) {
            const config = { ...request.data, token: result.github_token };
            pushQueueToGitHub(config).then(sendResponse);
        } else {
            sendResponse({ status: 'error', message: 'Not logged in.' });
        }
    });
    return true; // Keep the message channel open for the async response
  }
});