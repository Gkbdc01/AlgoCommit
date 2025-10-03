// src/content.js

console.log("AlgoCommit Smart-Capture script loaded!");

let submissionInProgress = false;

const startScrapingProcess = () => {
  let attempts = 0;
  const maxAttempts = 20;

  const pollForElements = setInterval(() => {
    const titleElement = document.querySelector('a.truncate[href^="/problems/"]');
    const languageElement = document.querySelector('button[aria-haspopup="dialog"]');
    const editorElement = document.querySelector('.monaco-editor');

    if (titleElement && languageElement && editorElement) {
      clearInterval(pollForElements);
      try {
        const rawTitle = titleElement.innerText;
        const title = rawTitle.includes('. ') ? rawTitle.split('. ')[1].trim() : rawTitle.trim();
        const language = languageElement.firstChild.textContent.trim();
        const codeLines = Array.from(editorElement.querySelectorAll('.view-line'));
        const code = codeLines.map(line => line.innerText).join('\n');
        
        const solutionData = { title, language, code };
        chrome.runtime.sendMessage({ action: 'new_solution', data: solutionData });
        submissionInProgress = false;
      } catch (error) {
        console.error("AlgoCommit: Error during scraping.", error);
        submissionInProgress = false;
      }
    }

    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(pollForElements);
      console.error("AlgoCommit: Timed out waiting for elements.");
      submissionInProgress = false;
    }
  }, 200);
};

const observer = new MutationObserver((mutations, obs) => {
  const successNode = Array.from(document.querySelectorAll('span')).find(
    span => span.textContent.trim() === 'Accepted'
  );
  if (successNode && submissionInProgress) {
    obs.disconnect(); 
    startScrapingProcess();
  }
});

const attachSubmitListener = () => {
    const submitButton = document.querySelector('button[data-e2e-locator="submission-button"]');
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            submissionInProgress = true;
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        setTimeout(attachSubmitListener, 1000);
    }
};

attachSubmitListener();
observer.observe(document.body, { childList: true, subtree: true });