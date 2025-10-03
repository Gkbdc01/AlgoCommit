console.log("AlgoCommit content script loaded and ready for action!");

const startScrapingProcess = () => {
  let attempts = 0;
  const maxAttempts = 20; // Try for 4 seconds (20 * 200ms)

  const pollForElements = setInterval(() => {
    console.log(`AlgoCommit: Polling for elements... Attempt #${attempts + 1}`);

    const titleElement = document.querySelector('a.truncate[href^="/problems/"]');
    const languageElement = document.querySelector('button[aria-haspopup="dialog"]');
    const editorElement = document.querySelector('.monaco-editor');

    if (titleElement && languageElement && editorElement) {
      clearInterval(pollForElements);
      console.log("AlgoCommit: All elements found! Proceeding to scrape.");

      try {
        const rawTitle = titleElement.innerText;
        const title = rawTitle.includes('. ') ? rawTitle.split('. ')[1].trim() : rawTitle.trim();

        // FINAL FIX for Language: Target the first direct child text node.
        const language = languageElement.firstChild.textContent.trim();

        // FINAL FIX for Code: Find all the specific 'view-line' divs inside the editor.
        const codeLines = Array.from(editorElement.querySelectorAll('.view-line'));
        const code = codeLines.map(line => line.innerText).join('\n');
        
        const solutionData = { title, language, code };
        console.log("AlgoCommit: Scraped data successfully:", solutionData);
        chrome.runtime.sendMessage({ action: 'new_solution', data: solutionData });
      } catch (error) {
        console.error("AlgoCommit: A critical error occurred during scraping.", error);
      }
    }

    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(pollForElements);
      console.error("AlgoCommit: Timed out waiting for elements to appear.");
    }
  }, 200);
};

const observer = new MutationObserver((mutations, obs) => {
  const successNode = Array.from(document.querySelectorAll('span')).find(
    span => span.textContent.trim() === 'Accepted'
  );

  if (successNode) {
    console.log("AlgoCommit: 'Accepted' status detected! Disconnecting observer and starting scrape.");
    obs.disconnect(); 
    startScrapingProcess();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});