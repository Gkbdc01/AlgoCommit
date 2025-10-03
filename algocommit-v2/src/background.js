// src/background.js

// A helper function to get the correct file extension for a given language
function getFileExtension(language) {
  const languageMap = {
    'python': 'py',
    'python3': 'py',
    'java': 'java',
    'javascript': 'js',
    'cpp': 'cpp',
    'csharp': 'cs',
    'typescript': 'ts',
    'golang': 'go',
    'ruby': 'rb',
    'swift': 'swift',
    'kotlin': 'kt',
    'scala': 'scala',
    'rust': 'rs',
    'php': 'php',
  };
  return languageMap[language.toLowerCase()] || 'txt';
}

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'new_solution') {
    // Get the current queue, add the new solution, and save it back
    chrome.storage.local.get(['solution_queue'], (result) => {
      const queue = result.solution_queue || [];
      queue.push(request.data);
      chrome.storage.local.set({ solution_queue: queue }, () => {
        console.log('Solution added to the queue.');
      });
    });
  }
  return true; // Indicates you wish to send a response asynchronously
});