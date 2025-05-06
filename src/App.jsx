import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const topics = ['Moda', 'Historia', 'Ciencia', 'Deporte', 'Arte'];

function parseQuestions(rawQuestions) {
  return rawQuestions.map((block) => {
    const lines = block.split('\n').map(line => line.trim());
    const textLine = lines.find(l => /^\d/.test(l)) || lines[0];
    const options = {};
    let answer = null;

    lines.forEach(line => {
      const optMatch = line.match(/^([A-D])\)\s+(.*)/);
      if (optMatch) {
        options[optMatch[1]] = optMatch[2];
      }
      const ansMatch = line.match(/Respuesta:\s*([A-D])/);
      if (ansMatch) {
        answer = ansMatch[1];
      }
    });

    return {
      text: textLine.replace(/^\d+\.\s*/, ''),
      options,
      answer,
    };
  });
}


export default function App() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const getQuestions = async (topic) => {
    setLoading(true);
    try {
      const res = await axios.post('https://preguntados-back-eight.vercel.app/api/generate-questions', { topic });
      setSelectedTopic(topic);
      // Procesar preguntas
      const parsed = parseQuestions(res.data.questions);
      setQuestions(parsed);
      setAnswers({});
      setScore(null);
    } catch (error) {
      console.error('Error al obtener preguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const submitQuiz = async () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    setScore(correct);
    try {
      await axios.post('https://preguntados-back-eight.vercel.app/api/save-quiz', {
        topic: selectedTopic,
        questions: questions.map(q => q.text),
        score: correct,
      });
    } catch (error) {
      console.error('Error al guardar el quiz:', error);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Preguntados</h1>
        <p>Elige un tema y demuestra tus conocimientos</p>
      </header>

      {!questions.length && !loading && (
        <div className="topics-container">
          {topics.map((t) => (
            <button 
              key={t} 
              onClick={() => getQuestions(t)} 
              className="topic-button"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generando preguntas...</p>
        </div>
      )}

      {questions.length > 0 && !loading && (
        <div className="quiz-container">
         
          <h2 className="quiz-topic">Tema: {selectedTopic}</h2>
          <div className="questions-container">
            {questions.map((q, i) => (
              <div key={i} className="question-card">
                <p className="question-text">{i + 1}. {q.text}</p>
                <div className="options-container">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    q.options[opt] && (
                      <label key={opt} className="option-label">
                        <input
                          type="radio"
                          name={`q${i}`}
                          value={opt}
                          onChange={() => handleChange(i, opt)}
                          checked={answers[i] === opt}
                          className="option-input"
                        />
                        <span className="option-text">{opt}) {q.options[opt]}</span>
                      </label>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={submitQuiz} 
            className="submit-button"
            disabled={Object.keys(answers).length !== questions.length}
          >
            Enviar Respuestas
          </button>

          {score !== null && (
            <div className="score-container">
              <h2 className="score-title">Tu Puntaje</h2>
              <p className="score-text">{score} / {questions.length}</p>
              <p className="score-percentage">
                {Math.round((score / questions.length) * 100)}%
              </p>
            </div>
          )}

<button 
            className="home-button"
            onClick={() => {
              setQuestions([]);
              setAnswers({});
              setScore(null);
              setSelectedTopic(null);
            }}
          >
            🏠 Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
}
