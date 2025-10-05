function getFileExtension(language) {
  const languageMap = { 'python': 'py', 'python3': 'py', 'java': 'java', 'javascript': 'js', 'cpp': 'cpp', 'csharp': 'cs', 'typescript': 'ts', 'golang': 'go', 'ruby': 'rb', 'swift': 'swift', 'kotlin': 'kt', 'scala': 'scala', 'rust': 'rs', 'php': 'php' };
  return languageMap[language.toLowerCase()] || 'txt';
}

async function pushQueueToGitHub(config) {
  const { owner, repo, token, folder } = config;
  const { solution_queue: queue } = await chrome.storage.local.get('solution_queue');

  if (!queue || queue.length === 0) {
    return { status: 'noop', message: 'Queue is empty.' };
  }

  for (const solution of queue) {
    const fileExtension = getFileExtension(solution.language);
    const safeTitle = solution.title.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
    const fileName = `${safeTitle}.${fileExtension}`;
    const path = folder ? `${folder}/${fileName}` : fileName;
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

  await chrome.storage.local.set({ solution_queue: [] });
  return { status: 'success', message: 'Successfully pushed!' };
}

async function ensureRepoExists(config) {
  const { owner, repo, token } = config;
  const getUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const createUrl = `https://api.github.com/user/repos`;

  const getResponse = await fetch(getUrl, { headers: { 'Authorization': `token ${token}` } });

  if (getResponse.ok) return { status: 'success', message: 'Repository found.' };

  if (getResponse.status === 404) {
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Authorization': `token ${token}` },
      body: JSON.stringify({
        name: repo,
        description: 'A repository for LeetCode solutions, created by AlgoCommit.',
        private: false,
      }),
    });

    if (createResponse.ok) return { status: 'success', message: `Created repository: ${repo}` };
    const errorData = await createResponse.json();
    return { status: 'error', message: `GitHub API Error: ${errorData.message}` };
  }
  
  const errorData = await getResponse.json();
  return { status: 'error', message: `GitHub API Error: ${errorData.message}` };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'new_solution') {
    chrome.storage.local.get(['solution_queue'], (result) => {
      const queue = result.solution_queue || [];
      queue.push(request.data);
      chrome.storage.local.set({ solution_queue: queue }, () => sendResponse({ status: 'success' }));
    });
    return true;
  }
  
  if (request.action === 'push_to_github') {
    chrome.storage.local.get(['github_token', 'github_folder'], (result) => {
      if (result.github_token) {
        const config = { ...request.data, token: result.github_token, folder: result.github_folder };
        pushQueueToGitHub(config).then(sendResponse);
      } else {
        sendResponse({ status: 'error', message: 'Not logged in.' });
      }
    });
    return true;
  }
  
  if (request.action === 'ensure_repo') {
    chrome.storage.local.get('github_token', (result) => {
      if (result.github_token) {
        const config = { ...request.data, token: result.github_token };
        ensureRepoExists(config).then(sendResponse);
      } else {
        sendResponse({ status: 'error', message: 'Not logged in.' });
      }
    });
    return true;
  }
});