/**
 * ============================================
 * QUESTION CLASS
 * ============================================
 * 
 * This class handles displaying and interacting with a single question.
 * 
 * PROPERTIES TO CREATE:
 * - quiz (Quiz) - Reference to the Quiz instance
 * - container (HTMLElement) - DOM element to render into
 * - onQuizEnd (Function) - Callback when quiz ends
 * - questionData (object) - Current question from quiz.getCurrentQuestion()
 * - index (number) - Current question index
 * - question (string) - The decoded question text
 * - correctAnswer (string) - The decoded correct answer
 * - category (string) - The decoded category name
 * - wrongAnswers (array) - Decoded incorrect answers
 * - allAnswers (array) - Shuffled array of all answers
 * - answered (boolean) - Has user answered? Starts false
 * - timerInterval (number) - The setInterval ID
 * - timeRemaining (number) - Seconds left, starts at 30 seconds
 * 
 * METHODS TO IMPLEMENT:
 * - constructor(quiz, container, onQuizEnd)
 * - decodeHtml(html) - Decode HTML entities like &amp;
 * - shuffleAnswers() - Shuffle answers randomly
 * - getProgress() - Calculate progress percentage
 * - displayQuestion() - Render the question HTML
 * - addEventListeners() - Add click handlers to answers
 * - removeEventListeners() - Cleanup handlers
 * - startTimer() - Start countdown
 * - stopTimer() - Stop countdown
 * - handleTimeUp() - When timer reaches 0
 * - checkAnswer(choiceElement) - Check if answer is correct
 * - highlightCorrectAnswer() - Show correct answer
 * - getNextQuestion() - Load next or show results
 * - animateQuestion(duration) - Transition to next
 * 
 * HTML ENTITIES:
 * The API returns text with HTML entities like:
 * - &amp; should become &
 * - &quot; should become "
 * - &#039; should become '
 * 
 * Use this trick to decode:
 * const doc = new DOMParser().parseFromString(html, 'text/html');
 * return doc.documentElement.textContent;
 * 
 * SHUFFLE ALGORITHM (Fisher-Yates):
 * for (let i = array.length - 1; i > 0; i--) {
 *   const j = Math.floor(Math.random() * (i + 1));
 *   [array[i], array[j]] = [array[j], array[i]];
 * }
 */



export default class Question {
  
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;
    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;
    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map(answer => this.decodeHtml(answer));
    this.allAnswers = this.shuffleAnswers();
    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 30;
  }
  
  
  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
  }
  
  
  shuffleAnswers() {
    const answers = [...this.wrongAnswers, this.correctAnswer];

    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    return answers;
  }
  
  
  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }
  
  
  displayQuestion() {
    const answers = this.allAnswers.map((answer, index) => `
      <button class="answer-btn" data-answer="${answer}">
        <span class="answer-key">${index + 1}</span>
        <span class="answer-text">${answer}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="game-card question-card">
        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
          <div class="xp-bar"><div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div></div>
        </div>
        <div class="stats-row">
          <div class="stat-badge category"><i class="fa-solid fa-bookmark"></i><span>${this.category}</span></div>
          <div class="stat-badge difficulty ${this.quiz.difficulty}"><i class="fa-solid fa-gauge-high"></i><span>${this.quiz.difficulty}</span></div>
          <div class="stat-badge timer"><i class="fa-solid fa-stopwatch"></i><span class="timer-value">${this.timeRemaining}</span>s</div>
          <div class="stat-badge counter"><i class="fa-solid fa-gamepad"></i><span>${this.index + 1}/${this.quiz.numberOfQuestions}</span></div>
        </div>
        <h2 class="question-text">${this.question}</h2>
        <div class="answers-grid">${answers}</div>
        <p class="keyboard-hint"><i class="fa-regular fa-keyboard"></i> Press 1-4 to select</p>
        <div class="score-panel"><div class="score-item"><div class="score-item-label">Score</div><div class="score-item-value">${this.quiz.score}</div></div></div>
      </div>
    `;

    this.addEventListeners();
    this.startTimer();
  }
  
  
  addEventListeners() {
    const answerButtons = document.querySelectorAll('.answer-btn');

    answerButtons.forEach(button => {
      button.addEventListener('click', () => this.checkAnswer(button));
    });

    this.handleKeydown = event => {
      const answerIndex = ['1', '2', '3', '4'].indexOf(event.key);
      if (answerIndex !== -1 && answerButtons[answerIndex]) {
        this.checkAnswer(answerButtons[answerIndex]);
      }
    };

    document.addEventListener('keydown', this.handleKeydown);
  }
  
  
  removeEventListeners() {
    document.removeEventListener('keydown', this.handleKeydown);
  }
  
  
  startTimer() {
    const timerDisplay = this.container.querySelector('.timer-value');

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timerDisplay.textContent = this.timeRemaining;

      if (this.timeRemaining <= 10) {
        timerDisplay.parentElement.classList.add('warning');
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }
  
  
  stopTimer() {
    clearInterval(this.timerInterval);
  }
  
  
  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    const answerButtons = this.container.querySelectorAll('.answer-btn');
    const correctButton = [...answerButtons].find(button =>
      button.dataset.answer.toLowerCase() === this.correctAnswer.toLowerCase()
    );

    correctButton?.classList.add('correct');
    this.container.querySelector('.answers-grid').insertAdjacentHTML(
      'afterend',
      '<div class="time-up-message"><i class="fa-solid fa-clock"></i> TIME\'S UP!</div>'
    );

    setTimeout(() => this.animateQuestion(), 1000);
  }
  
  
  checkAnswer(choiceElement) {
    if (this.answered) return;

    this.answered = true;
    this.stopTimer();

    const selectedAnswer = choiceElement.dataset.answer;
    const isCorrect = selectedAnswer.toLowerCase() === this.correctAnswer.toLowerCase();

    if (isCorrect) {
      choiceElement.classList.add('correct');
      this.quiz.incrementScore();
    } else {
      choiceElement.classList.add('wrong');
      this.highlightCorrectAnswer();
    }

    this.container.querySelectorAll('.answer-btn').forEach(button => {
      if (button !== choiceElement) button.classList.add('disabled');
    });

    this.animateQuestion();
  }
  
  
  // TODO: Create highlightCorrectAnswer() method
  // Find the button with correct answer and add 'correct-reveal' class
  
  
  // TODO: Create getNextQuestion() method
  // 1. Call quiz.nextQuestion()
  // 2. If returns true: create new Question and display it
  // 3. If returns false: show results using quiz.endQuiz()
  //    Also add click listener to Play Again button
  
  
  // TODO: Create animateQuestion(duration) method
  // 1. Wait for 1500ms (transition delay)
  // 2. Add 'exit' class to question card
  // 3. Wait for duration
  // 4. Call getNextQuestion()
  
}
