from flask import Flask, jsonify, request, render_template
import json
import os

app = Flask(__name__)

# Path to the production dataset
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'mock1_production_final.json')

# Load questions once at startup
try:
    with open(DATA_PATH, encoding='utf-8') as f:
        data = json.load(f)
        QUESTIONS = data.get('questions', [])  # Extract questions from production format
        print(f"✅ Loaded {len(QUESTIONS)} questions from production dataset")
except FileNotFoundError:
    QUESTIONS = []
    print(f"Warning: Could not find {DATA_PATH}")

@app.route('/')
def index():
    return render_template('quiz.html')

@app.route('/api/questions')
def get_questions():
    # Return all questions
    return jsonify(QUESTIONS)

@app.route('/api/answer', methods=['POST'])
def check_answer():
    data = request.json
    question_idx = data.get('question')
    user_answer = data.get('answer')
    
    if question_idx is None or user_answer is None:
        return jsonify({'correct': False, 'error': 'Missing data'}), 400
    
    if question_idx >= len(QUESTIONS):
        return jsonify({'correct': False, 'error': 'Invalid question index'}), 400
    
    question = QUESTIONS[question_idx]
    correct_answer_text = question.get('correct_answer', '')
    options = question.get('options', [])
    
    # Find the correct answer index by matching the text
    correct_answer_idx = None
    for i, option in enumerate(options):
        if option == correct_answer_text or option.strip() == correct_answer_text.strip():
            correct_answer_idx = i
            break
    
    if correct_answer_idx is None:
        # Fallback: try to match by the letter at the beginning (A, B, C, etc.)
        if correct_answer_text and len(correct_answer_text) > 0:
            first_char = correct_answer_text[0].upper()
            if first_char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
                correct_answer_idx = ord(first_char) - ord('A')
                if correct_answer_idx >= len(options):
                    correct_answer_idx = None
    
    if correct_answer_idx is None:
        return jsonify({'correct': False, 'error': 'Could not determine correct answer'}), 400
    
    is_correct = user_answer == correct_answer_idx
    
    return jsonify({
        'correct': is_correct,
        'correct_answer': correct_answer_idx,
        'correct_answer_text': correct_answer_text,
        'explanation': question.get('explanation', '').replace('\\n', '\n')
    })

if __name__ == '__main__':
    # For development
    app.run(debug=True, host='0.0.0.0', port=5000)
else:
    # For production (gunicorn will use this)
    application = app