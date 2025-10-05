// src/background.js

async function ensureRepoExists(config) {
  const { owner, repo, token } = config;
  const getUrl = `https://api.github.com/repos/${owner}/${repo}`;
  try {
    const getResponse = await fetch(getUrl, { headers: { 'Authorization': `token ${token}` } });
    if (getResponse.ok) return { status: 'success', message: 'Repository found.' };

    if (getResponse.status === 404) {
      const createUrl = `https://api.github.com/user/repos`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ name: repo, description: 'Repo for LeetCode solutions by AlgoCommit.', private: false }),
      });
      if (createResponse.ok) return { status: 'success', message: `Created repository: ${repo}` };
      const errorData = await createResponse.json();
      throw new Error(`Repo creation failed: ${errorData.message}`);
    }
    const errorData = await getResponse.json();
    throw new Error(`Repo check failed: ${errorData.message}`);
  } catch (error) {
    console.error("AlgoCommit: ensureRepoExists error", error);
    return { status: 'error', message: error.message };
  }
}

async function fetchUserDetails(token) {
  const url = 'https://api.github.com/user';
  try {
    const response = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API Error: ${errorData.message}`);
    }
    const userData = await response.json();
    return { status: 'success', data: { username: userData.login } };
  } catch (error) {
    console.error("AlgoCommit: Error fetching user details.", error);
    return { status: 'error', message: error.message };
  }
}

async function pushSolutions(config, solutionsToPush) {
  const { owner, repo, token, folder } = config;
  if (!solutionsToPush || solutionsToPush.length === 0) return { status: 'noop', message: 'No items selected.' };

  for (const solution of solutionsToPush) {
    const fileExtension = solution.language.toLowerCase();
    const safeTitle = solution.title.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
    const fileName = `${safeTitle}.${fileExtension}`;
    const path = folder ? `${folder}/${fileName}` : fileName;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const message = `feat: Solve LeetCode problem '${solution.title}'`;
    const content = btoa(unescape(encodeURIComponent(solution.code)));
    
    try {
      // Step 1: Check if the file already exists to get its SHA
      const getFileResponse = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });

      let sha;
      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha; // Get the SHA if the file exists
      }

      // Step 2: Create or update the file, including the SHA if it exists
      const putResponse = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ message, content, sha }), // Add sha to the body for updates
      });

      if (!putResponse.ok) {
        const errorData = await putResponse.json();
        throw new Error(`GitHub API Error for '${solution.title}': ${errorData.message}`);
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
  return { status: 'success', message: 'Successfully pushed!' };
}

// A single, unified listener for all messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === 'new_solution') {
      const { solution_queue } = await chrome.storage.local.get('solution_queue');
      const queue = solution_queue || [];
      queue.push(request.data);
      await chrome.storage.local.set({ solution_queue: queue });
      sendResponse({ status: 'success' });
    } else if (request.action === 'ensure_repo') {
      const { github_token } = await chrome.storage.local.get('github_token');
      if (github_token) {
        const config = { ...request.data, token: github_token };
        const response = await ensureRepoExists(config);
        sendResponse(response);
      } else {
        sendResponse({ status: 'error', message: 'Not logged in.' });
      }
    } else if (request.action === 'fetch_user') {
      const response = await fetchUserDetails(request.token);
      sendResponse(response);
    } else if (request.action === 'push_selected_to_github') {
      const settings = await chrome.storage.local.get(['github_token', 'github_owner', 'github_repo', 'github_folder', 'solution_queue']);
      if (settings.github_token) {
        const config = {
          owner: settings.github_owner,
          repo: settings.github_repo,
          token: settings.github_token,
          folder: settings.github_folder
        };
        const pushResult = await pushSolutions(config, request.data.solutions);
        if (pushResult.status === 'success') {
          const fullQueue = settings.solution_queue || [];
          const pushedTitles = new Set(request.data.solutions.map(s => s.title));
          const remainingQueue = fullQueue.filter(s => !pushedTitles.has(s.title));
          await chrome.storage.local.set({ solution_queue: remainingQueue });
        }
        sendResponse(pushResult);
      } else {
        sendResponse({ status: 'error', message: 'Not logged in.' });
      }
    }
  })();
  
  // Return true to indicate that the response will be sent asynchronously.
  return true;
});