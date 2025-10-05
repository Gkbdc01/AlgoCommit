// src/content.js
console.log("AlgoCommit Smart-Capture script loaded!");

let submissionInProgress = false;
let problemData = { title: null, language: null }; // Variable to hold pre-scraped data

// Function to scrape static data as soon as the page is stable
// Function to scrape static data as soon as the page is stable
const preScrape = () => {
    let attempts = 0;
    const maxAttempts = 50; // 10 seconds
    const poll = setInterval(() => {
        const titleElement = document.querySelector('a.truncate[href^="/problems/"]');
        // CORRECTED: The selector for the language is now the editor div
        const languageElement = document.querySelector('div[data-mode-id]');

        if (titleElement && languageElement) {
            clearInterval(poll);
            const rawTitle = titleElement.innerText;
            problemData.title = rawTitle.includes('. ') ? rawTitle.split('. ')[1].trim() : rawTitle.trim();
            
            // CORRECTED: We now read the 'data-mode-id' attribute directly
            problemData.language = languageElement.getAttribute('data-mode-id');
            
            console.log("AlgoCommit: Pre-scraped problem data:", problemData);
        }

        attempts++;
        if (attempts >= maxAttempts) {
            clearInterval(poll);
            console.error("AlgoCommit: Timed out pre-scraping title and language.");
        }
    }, 200);
};
// Function to scrape only the code after submission
const scrapeCodeAndFinalize = () => {
    let attempts = 0;
    const maxAttempts = 50; // 10 seconds
    const poll = setInterval(() => {
        const editorElement = document.querySelector('.monaco-editor');

        if (editorElement) {
            clearInterval(poll);
            try {
                const codeLines = Array.from(editorElement.querySelectorAll('.view-line'));
                const code = codeLines.map(line => line.innerText).join('\n');
                
                const finalSolution = { ...problemData, code: code };
                console.log("AlgoCommit: Final solution data scraped:", finalSolution);
                chrome.runtime.sendMessage({ action: 'new_solution', data: finalSolution });

            } catch (error) {
                console.error("AlgoCommit: Error during final code scraping.", error);
            }
            submissionInProgress = false;
        }

        attempts++;
        if (attempts >= maxAttempts) {
            clearInterval(poll);
            console.error("AlgoCommit: Timed out waiting for code editor.");
            submissionInProgress = false;
        }
    }, 200);
};

const observer = new MutationObserver((mutations, obs) => {
  const successNode = Array.from(document.querySelectorAll('div')).find(
    div => div.textContent.trim() === 'Accepted'
  );
  if (successNode && submissionInProgress) {
    console.log("AlgoCommit: 'Accepted' status detected. Now scraping code.");
    obs.disconnect(); 
    scrapeCodeAndFinalize();
  }
});

const attachSubmitListener = () => {
    const submitButton = document.querySelector('button[data-e2e-locator="console-submit-button"]');
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            console.log("AlgoCommit: Submit button clicked! Now watching for result.");
            // If pre-scraping failed, try it again just in case
            if (!problemData.title || !problemData.language) {
                preScrape();
            }
            submissionInProgress = true;
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        setTimeout(attachSubmitListener, 1000);
    }
};

// --- Initial Execution ---
preScrape(); // Scrape the static info as soon as the script loads
attachSubmitListener();