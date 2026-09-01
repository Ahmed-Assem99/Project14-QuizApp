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



// ============================================
const quizOptionsForm = document.getElementById('quizOptions');
const playerNameInput = document.getElementById('playerName');
const categoryInput = document.getElementById('categoryMenu');
const difficultyOptions = document.getElementById('difficultyOptions');
const questionsNumber = document.getElementById('questionsNumber');
const startQuizBtn = document.getElementById('startQuiz');
const questionsContainer = document.querySelector('.questions-container');


// ============================================
let currentQuiz = null;


// ============================================
function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}


// ============================================
function hideLoading() {
  questionsContainer.querySelector('.loading-overlay')?.remove();
}


// ============================================
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

  questionsContainer.querySelector('.retry-btn').addEventListener('click', resetToStart);
}


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


function showFormError(message) {
  quizOptionsForm.querySelector('.form-error')?.remove();

  const error = document.createElement('div');
  error.className = 'form-error';
  error.textContent = message;
  startQuizBtn.before(error);

  setTimeout(() => {
    error.style.transition = 'opacity 0.3s ease';
    error.style.opacity = '0';
    setTimeout(() => error.remove(), 300);
  }, 3000);
}


function resetToStart() {
  questionsContainer.innerHTML = '';
  quizOptionsForm.reset();
  quizOptionsForm.classList.remove('hidden');
  currentQuiz = null;
}


async function startQuiz() {
  const validation = validateForm();

  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }

  const playerName = playerNameInput.value.trim() || 'Player';
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = Number(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);
  quizOptionsForm.classList.add('hidden');
  showLoading();

  try {
    const params = new URLSearchParams({
      amount: numberOfQuestions,
      difficulty,
      type: 'multiple'
    });

    if (category) {
      params.set('category', category);
    }

    const response = await fetch(`https://opentdb.com/api.php?${params}`);

    if (!response.ok) {
      throw new Error('Unable to load questions. Please try again.');
    }

    const data = await response.json();

    if (data.response_code !== 0 || !data.results?.length) {
      throw new Error('No questions were found. Please try different options.');
    }

    const questions = data.results;
    console.log(questions)
    currentQuiz.questions = questions;
    hideLoading();

    const question = new Question(currentQuiz, questionsContainer, () => {
      questionsContainer.innerHTML = currentQuiz.endQuiz();
    });
    question.displayQuestion();
  } catch (error) {
    hideLoading();
    showError(error.message || 'Unable to load questions. Please try again.');
  }
}


startQuizBtn.addEventListener('click', startQuiz);

questionsNumber.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    startQuiz();
  }
});

