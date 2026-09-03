import Quiz from './quiz.js';
import Question from './question.js';

/**
 * ============================================
 * MAIN ENTRY POINT (index.js)
 * ============================================
 * 
 * This file is the starting point of your application.
 * It handles:
 * - Getting DOM elements
 * - Form validation
 * - Starting the quiz
 * - Loading/error states
 * 
 * DOM ELEMENTS TO GET:
 * - quizOptionsForm: #quizOptions
 * - playerNameInput: #playerName
 * - categoryInput: #categoryMenu
 * - difficultyOptions: #difficultyOptions
 * - questionsNumber: #questionsNumber
 * - startQuizBtn: #startQuiz
 * - questionsContainer: .questions-container
 * 
 * FUNCTIONS TO IMPLEMENT:
 * - showLoading() - Display loading spinner
 * - hideLoading() - Remove loading spinner
 * - showError(message) - Display error card
 * - validateForm() - Check if form is valid
 * - showFormError(message) - Show error on form
 * - resetToStart() - Reset to initial state
 * - startQuiz() - Main function to start quiz
 */



// Get references to the form controls and area where questions/messages appear.
const quizOptionsForm = document.getElementById('quizOptions');
const playerNameInput = document.getElementById('playerName');
const categoryInput = document.getElementById('categoryMenu');
const difficultyOptions = document.getElementById('difficultyOptions');
const questionsNumber = document.getElementById('questionsNumber');
const startQuizBtn = document.getElementById('startQuiz');
const questionsContainer = document.querySelector('.questions-container');


// Stores the active quiz so it can be used by the question screen and results screen.
let currentQuiz = null;


// Replace the question area with a loading indicator while questions are requested.
function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}


// Remove the loading indicator once the request has finished.
function hideLoading() {
  questionsContainer.querySelector('.loading-overlay')?.remove();
}


// Display an error card and allow the player to return to the quiz options.
function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;

  // The retry button is created above, so attach its listener after adding it to the page.
  questionsContainer.querySelector('.retry-btn').addEventListener('click', resetToStart);
}


// Ensure the requested question count is present and within the API's allowed range.
function validateForm() {
  const value = questionsNumber.value.trim();

  if (!value) {
    return { isValid: false, error: 'Please enter the number of questions.' };
  }

  const numberOfQuestions = Number(value);

  if (numberOfQuestions < 1) {
    return { isValid: false, error: 'Please enter at least 1 question.' };
  }

  if (numberOfQuestions > 50) {
    return { isValid: false, error: 'Please enter no more than 50 questions.' };
  }

  return { isValid: true, error: null };
}


// Show one temporary validation message directly above the Start Quiz button.
function showFormError(message) {
  // Avoid showing multiple validation messages at the same time.
  quizOptionsForm.querySelector('.form-error')?.remove();

  const error = document.createElement('div');
  error.className = 'form-error';
  error.textContent = message;
  startQuizBtn.before(error);

  // Fade out the message after three seconds, then remove it from the DOM.
  setTimeout(() => {
    error.style.transition = 'opacity 0.3s ease';
    error.style.opacity = '0';
    setTimeout(() => error.remove(), 300);
  }, 3000);
}


// Clear the quiz screen and restore the initial options form.
function resetToStart() {
  questionsContainer.innerHTML = '';
  quizOptionsForm.reset();
  quizOptionsForm.classList.remove('hidden');
  currentQuiz = null;
}


// Validate the options, request questions from Open Trivia DB, then show the first question.
async function startQuiz() {
  const validation = validateForm();

  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }

  // Read the selected options; use "Player" when no name was supplied.
  const playerName = playerNameInput.value.trim() || 'Player';
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = Number(questionsNumber.value);

  // Create a quiz object before loading its questions.
  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);
  quizOptionsForm.classList.add('hidden');
  showLoading();

  try {
    // Quiz owns the API request and stores the returned questions.
    await currentQuiz.getQuestions();
    hideLoading();

    // Pass a callback that renders the results when the final question is answered.
    const question = new Question(currentQuiz, questionsContainer, () => {
      questionsContainer.innerHTML = currentQuiz.endQuiz();
    });
    question.displayQuestion();
  } catch (error) {
    // Handle network failures and API errors in the same user-friendly way.
    hideLoading();
    showError(error.message || 'Unable to load questions. Please try again.');
  }
}


// Start the quiz when the player clicks the button.
startQuizBtn.addEventListener('click', startQuiz);

// Let the player start from the question-count field by pressing Enter.
questionsNumber.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    // Stop the form's default Enter behavior before starting the quiz.
    event.preventDefault();
    startQuiz();
  }
});
