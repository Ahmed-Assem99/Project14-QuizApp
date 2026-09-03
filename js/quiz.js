/**
 * ============================================
 * QUIZ CLASS
 * ============================================
 * 
 * This class manages the entire quiz game state.
 * 
 * PROPERTIES TO CREATE:
 * - category (string) - The selected category ID
 * - difficulty (string) - easy, medium, or hard
 * - numberOfQuestions (number) - How many questions
 * - playerName (string) - The player's name
 * - score (number) - Current score, starts at 0
 * - questions (array) - Questions from API, starts empty
 * - currentQuestionIndex (number) - Which question we're on, starts at 0
 * 
 * METHODS TO IMPLEMENT:
 * - constructor(category, difficulty, numberOfQuestions, playerName)
 * - async getQuestions() - Fetch questions from API
 * - buildApiUrl() - Create the API URL with parameters
 * - incrementScore() - Add 1 to score
 * - getCurrentQuestion() - Get the current question object
 * - nextQuestion() - Move to next question, return true/false
 * - isComplete() - Check if quiz is finished
 * - getScorePercentage() - Calculate percentage (0-100)
 * - saveHighScore() - Save to localStorage
 * - getHighScores() - Load from localStorage
 * - isHighScore() - Check if current score qualifies
 * - endQuiz() - Generate results screen HTML
 * 
 */


export default class Quiz {
  
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }
  
  
  async getQuestions() {
    const response = await fetch(this.buildApiUrl());

    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    const data = await response.json();

    if (data.response_code !== 0) {
      throw new Error("Unable to retrieve questions for the selected options.");
    }

    this.questions = data.results;
    return this.questions;
  }
  
  
  buildApiUrl() {
    const params = new URLSearchParams({
      amount: this.numberOfQuestions,
      difficulty: this.difficulty,
      type: 'multiple'
    });

    if (this.category) {
      params.set('category', this.category);
    }

    return `https://opentdb.com/api.php?${params}`;
  }
  
  
  incrementScore() {
    this.score += 1;
  }
  
  
  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] ?? null;
  }
  
  
  nextQuestion() {
    this.currentQuestionIndex += 1;
    return this.currentQuestionIndex < this.questions.length;
  }
  
  
  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }
  
  
  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }
  
  
  saveHighScore() {
    const highScores = this.getHighScores();
    const newScore = {
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString()
    };

    highScores.push(newScore);
    highScores.sort((a, b) => b.percentage - a.percentage);
    localStorage.setItem('quizHighScores', JSON.stringify(highScores.slice(0, 10)));
  }
  
  
  getHighScores() {
    try {
      const savedScores = localStorage.getItem('quizHighScores');
      const highScores = savedScores ? JSON.parse(savedScores) : [];
      return Array.isArray(highScores) ? highScores : [];
    } catch {
      return [];
    }
  }
  
  
  isHighScore() {
    const highScores = this.getHighScores();

    if (highScores.length < 10) {
      return true;
    }

    const currentPercentage = this.getScorePercentage();
    let lowestPercentage = highScores[0].percentage;

    for (let index = 1; index < highScores.length; index += 1) {
      if (highScores[index].percentage < lowestPercentage) {
        lowestPercentage = highScores[index].percentage;
      }
    }

    return currentPercentage > lowestPercentage;
  }
  
  
  endQuiz() {
    const percentage = this.getScorePercentage();
    const isHighScore = this.isHighScore();

    if (isHighScore) {
      this.saveHighScore();
    }

    const highScores = this.getHighScores();
    const leaderboardItems = highScores.map((highScore, index) => {
      const rankClass = index === 0 ? ' gold' : index === 1 ? ' silver' : index === 2 ? ' bronze' : '';

      return `
        <li class="leaderboard-item${rankClass}">
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-name">${highScore.name}</span>
          <span class="leaderboard-score">${highScore.percentage}%</span>
        </li>
      `;
    }).join('');

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>
        ${isHighScore ? `
          <div class="new-record-badge">
            <i class="fa-solid fa-star"></i> New High Score!
          </div>
        ` : ''}
        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">${leaderboardItems}</ul>
        </div>
        <div class="action-buttons">
          <button class="btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
  
}
