class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.submittedQuestions = []; // Track which questions have been submitted
        this.init();
    }

    async init() {
        try {
            await this.loadQuestions();
            this.initializeSidebar();
            this.setupEventListeners();
            this.displayQuestion();
            this.updateSidebarStats();
        } catch (error) {
            console.error('Failed to initialize quiz:', error);
            this.showError('Failed to load questions. Please refresh the page.');
        }
    }

    async loadQuestions() {
        const response = await fetch('/api/questions');
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        this.questions = await response.json();
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.submittedQuestions = new Array(this.questions.length).fill(false);
        this.updateProgressInfo();
    }

    initializeSidebar() {
        // Update total questions
        document.getElementById('total-questions').textContent = this.questions.length;
        
        // Create question navigation grid
        this.createQuestionGrid();
    }

    createQuestionGrid() {
        const grid = document.getElementById('question-grid');
        grid.innerHTML = '';
        
        for (let i = 0; i < this.questions.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'question-nav-btn';
            btn.textContent = i + 1;
            btn.onclick = () => this.goToQuestion(i);
            grid.appendChild(btn);
        }
    }

    updateSidebarStats() {
        const submitted = this.submittedQuestions.filter(submitted => submitted).length;
        const correct = this.getCorrectCount();
        const incorrect = submitted - correct;
        const remaining = this.questions.length - submitted;
        const scorePercentage = submitted > 0 ? Math.round((correct / submitted) * 100) : 0;

        // Update stat values
        document.getElementById('correct-count').textContent = correct;
        document.getElementById('incorrect-count').textContent = incorrect;
        document.getElementById('remaining-count').textContent = remaining;
        document.getElementById('score-percentage').textContent = `${scorePercentage}%`;

        // Update progress bar
        const progressPercent = (submitted / this.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').textContent = `${submitted} / ${this.questions.length}`;

        // Update question navigation buttons
        this.updateQuestionGrid();
    }

    updateQuestionGrid() {
        const buttons = document.querySelectorAll('.question-nav-btn');
        buttons.forEach((btn, index) => {
            btn.classList.remove('current', 'correct', 'incorrect');
            
            if (index === this.currentQuestion) {
                btn.classList.add('current');
            } else if (this.submittedQuestions[index] && this.userAnswers[index] !== null) {
                const isCorrect = this.isAnswerCorrect(index, this.userAnswers[index]);
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        });
    }

    getCorrectCount() {
        let correct = 0;
        for (let i = 0; i < this.userAnswers.length; i++) {
            if (this.submittedQuestions[i] && this.userAnswers[i] !== null && this.isAnswerCorrect(i, this.userAnswers[i])) {
                correct++;
            }
        }
        return correct;
    }

    isAnswerCorrect(questionIndex, answerIndex) {
        const question = this.questions[questionIndex];
        const selectedOption = question.options[answerIndex];
        const correctAnswer = question.correct_answer;
        
        // Extract the letter from the selected option (e.g., "A. Something" -> "A")
        const selectedLetter = selectedOption.charAt(0);
        return selectedLetter === correctAnswer;
    }

    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentQuestion = index;
            this.displayQuestion();
        }
    }

    setupEventListeners() {
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitAnswer());
        
        // Listen for option changes
        document.getElementById('options-form').addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.userAnswers[this.currentQuestion] = parseInt(e.target.value);
                this.updateSelectedOption();
                // Don't update stats here - only update on submission
            }
        });
    }

    displayQuestion() {
        if (this.questions.length === 0) {
            this.showError('No questions available.');
            return;
        }

        const question = this.questions[this.currentQuestion];
        const questionContainer = document.getElementById('question-content');
        
        questionContainer.innerHTML = `
            <h2>Question ${this.currentQuestion + 1} of ${this.questions.length}</h2>
            <div class="scenario">${question.scenario}</div>
        `;
        
        // Create options
        this.displayOptions(question.options || []);
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Clear feedback
        this.clearFeedback();
        
        // Update progress
        this.updateProgressInfo();
        
        // Update sidebar stats
        this.updateSidebarStats();
    }

    displayOptions(options) {
        const form = document.getElementById('options-form');
        form.innerHTML = '';
        
        options.forEach((option, index) => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'answer';
            radio.value = index;
            radio.id = `option-${index}`;
            
            // Check if this option was previously selected
            if (this.userAnswers[this.currentQuestion] === index) {
                radio.checked = true;
                label.classList.add('selected');
            }
            
            const text = document.createElement('span');
            text.innerHTML = option || `Option ${index + 1}`;
            
            label.appendChild(radio);
            label.appendChild(text);
            form.appendChild(label);
        });
    }

    updateSelectedOption() {
        const labels = document.querySelectorAll('.option-label');
        labels.forEach(label => label.classList.remove('selected'));
        
        const checkedRadio = document.querySelector('input[name="answer"]:checked');
        if (checkedRadio) {
            checkedRadio.closest('.option-label').classList.add('selected');
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        prevBtn.disabled = this.currentQuestion === 0;
        nextBtn.disabled = this.currentQuestion === this.questions.length - 1;
    }

    updateProgressInfo() {
        const answeredCount = this.userAnswers.filter(answer => answer !== null).length;
        document.getElementById('progress-info').textContent = 
            `Progress: ${answeredCount}/${this.questions.length} questions answered`;
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.displayQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.displayQuestion();
        }
    }

    async submitAnswer() {
        const selectedAnswer = this.userAnswers[this.currentQuestion];
        
        if (selectedAnswer === null) {
            this.showFeedback('Please select an answer before submitting.', 'incorrect');
            return;
        }

        try {
            const response = await fetch('/api/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: this.currentQuestion,
                    answer: selectedAnswer
                })
            });

            const result = await response.json();
            
            if (result.correct) {
                this.showFeedback('✅ Correct! Well done.', 'correct');
            } else {
                const correctOption = this.questions[this.currentQuestion].options[result.correct_answer];
                this.showFeedback(
                    `❌ Incorrect. The correct answer is: ${correctOption}`, 
                    'incorrect'
                );
            }

            // Show explanation if available
            if (result.explanation && result.explanation.trim()) {
                this.showExplanation(result.explanation);
            }

            // Mark this question as submitted
            this.submittedQuestions[this.currentQuestion] = true;

            // Update sidebar stats and navigation after submission
            this.updateSidebarStats();
            this.updateQuestionGrid();

        } catch (error) {
            console.error('Failed to submit answer:', error);
            this.showFeedback('Failed to submit answer. Please try again.', 'incorrect');
        }
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
    }

    showExplanation(explanation) {
        const feedback = document.getElementById('feedback');
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'explanation';
        
        // Format the explanation text (replace \n with <br> for better display)
        const formattedExplanation = explanation.replace(/\n/g, '<br>');
        explanationDiv.innerHTML = `<strong>Explanation:</strong><br>${formattedExplanation}`;
        
        feedback.appendChild(explanationDiv);
    }

    clearFeedback() {
        const feedback = document.getElementById('feedback');
        feedback.textContent = '';
        feedback.className = 'feedback';
    }

    showError(message) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = 'feedback incorrect';
    }
}

// Initialize the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
