
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import InteractiveMap from './components/InteractiveMap';
import { fetchWorldMapData } from './services/mapService';
import { TopoJSONData, CountryNameMappings, QuizQuestion } from './types';
import { frenchCountryNames } from './data/frenchCountryNames';
import { rawCapitalsData } from './data/quizCapitals';

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

type QuizState = 'idle' | 'active' | 'finished';

// Base64 encoded WAV for a short "ding" sound
const correctAnswerSoundDataUrl = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAA//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AL0AfAB8AD8A//8/AHwAfQC9APoA+gD6AA==';

const App: React.FC = () => {
  const [mapData, setMapData] = useState<TopoJSONData | null>(null);
  const [highlightedCountryId, setHighlightedCountryId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  const correctAnswerAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctAnswerAudioRef.current = new Audio(correctAnswerSoundDataUrl);
  }, []);

  const playCorrectAnswerSound = () => {
    if (correctAnswerAudioRef.current) {
      correctAnswerAudioRef.current.currentTime = 0;
      correctAnswerAudioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  };

  const nameIdMappings = useMemo(() => {
    const mapping: { [frenchName: string]: string } = {};
    for (const id in frenchCountryNames) {
      mapping[frenchCountryNames[id]] = id;
    }
    // Manual mappings for discrepancies
    mapping["Brunei"] = "096"; 
    mapping["Salvador"] = "222"; 
    mapping["États-Unis"] = "840"; 
    return mapping;
  }, []);


  useEffect(() => {
    fetchWorldMapData()
      .then(data => setMapData(data))
      .catch(error => console.error("Failed to load map data:", error));
  }, []);

  const generateQuizQuestions = useCallback(() => {
    const allCapitals = rawCapitalsData.filter(entry => entry.city !== null) as { country: string; city: string }[];
    const potentialQuestions: QuizQuestion[] = [];

    allCapitals.forEach(entry => {
      const countryId = nameIdMappings[entry.country];
      if (countryId && frenchCountryNames[countryId]) { 
        const correctAnswer = entry.city;
        let options = [correctAnswer];
        
        const otherCapitals = shuffleArray([...allCapitals.filter(c => c.city !== correctAnswer)])
                              .slice(0, 3)
                              .map(c => c.city);
        options.push(...otherCapitals);
        
        let uniqueCities = new Set(allCapitals.map(c => c.city));
        let i = 0;
        while(options.length < 4 && i < allCapitals.length) {
            const randomCity = allCapitals[i].city;
            if(!options.includes(randomCity)){
                options.push(randomCity);
            }
            i++;
        }
        options = Array.from(new Set(options)); 
        while(options.length < 4 && uniqueCities.size > options.length) {
            const cityToAdd = Array.from(uniqueCities).find(uc => !options.includes(uc));
            if (cityToAdd) options.push(cityToAdd); else break;
        }

        potentialQuestions.push({
          countryName: frenchCountryNames[countryId],
          capital: correctAnswer,
          countryId: countryId,
          options: shuffleArray(options.slice(0,4))
        });
      }
    });
    
    const generatedQuestions = shuffleArray(potentialQuestions).slice(0, 10); 
    setQuizQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizState('active');
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setShowCorrectAnswer(false);
    if (generatedQuestions.length > 0) {
        setHighlightedCountryId(generatedQuestions[0].countryId);
    }
  }, [nameIdMappings]);

  // FIX: Moved handleNextQuestion before handleAnswer because handleAnswer depends on it.
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setHighlightedCountryId(quizQuestions[nextIndex].countryId);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      setShowCorrectAnswer(false);
    } else {
      setQuizState('finished');
      setHighlightedCountryId(null); 
    }
  }, [currentQuestionIndex, quizQuestions]);

  const handleAnswer = useCallback((answer: string) => {
    if (quizState !== 'active' || showCorrectAnswer) return;

    const currentQuestion = quizQuestions[currentQuestionIndex];
    setSelectedAnswer(answer);
    
    if (answer === currentQuestion.capital) {
      setScore(prevScore => prevScore + 1);
      setAnswerFeedback('correct');
      playCorrectAnswerSound();
      setTimeout(() => {
        setShowCorrectAnswer(true); 
        setTimeout(handleNextQuestion, 700); 
      }, 300);
    } else {
      setAnswerFeedback('incorrect');
      setShowCorrectAnswer(true); 
    }
  }, [quizState, quizQuestions, currentQuestionIndex, showCorrectAnswer, playCorrectAnswerSound, handleNextQuestion]); 


  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-neutral-900 to-black text-slate-100 flex flex-col items-center p-4 pt-8 font-sans">
      <header className="text-center mb-6">
        <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500">
          Quiz des Capitales
        </h1>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {mapData ? (
            <InteractiveMap 
              mapData={mapData} 
              width={window.innerWidth * 0.9 * 0.66 > 800 ? 800 : window.innerWidth * 0.9 * 0.66} 
              height={window.innerHeight * 0.75 > 600 ? 600 : window.innerHeight * 0.70} 
              nameMappings={frenchCountryNames}
              highlightedCountryId={highlightedCountryId}
            />
          ) : (
            <div className="w-full h-[60vh] flex items-center justify-center bg-slate-800 rounded-xl shadow-xl border border-slate-700">
              <p className="text-2xl text-slate-400">Chargement de la carte...</p>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1 bg-neutral-800/80 backdrop-blur-md border border-neutral-700 p-6 rounded-xl shadow-2xl flex flex-col">
          {quizState === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-2xl font-semibold mb-6 text-slate-200">Prêt à tester vos connaissances ?</h2>
              <button 
                onClick={generateQuizQuestions}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 text-lg"
                aria-label="Commencer le quiz des capitales"
              >
                Commencer le Quiz
              </button>
            </div>
          )}

          {quizState === 'active' && currentQuestion && (
            <div className="flex flex-col h-full">
              <h2 className="text-2xl font-semibold mb-2 text-amber-400">Question {currentQuestionIndex + 1} / {quizQuestions.length}</h2>
              <p className="text-lg text-slate-300 mb-1">Quelle est la capitale de :</p>
              <p className="text-3xl font-bold mb-6 text-orange-400 py-2 px-3 bg-neutral-700/60 rounded-md inline-block break-words">
                {currentQuestion.countryName}
              </p>
              
              <div className="space-y-3 flex-grow">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.capital;
                  
                  let buttonClass = "w-full text-left px-4 py-3 rounded-lg transition-all duration-150 ease-in-out font-medium text-slate-100 ";
                  if (showCorrectAnswer) {
                    if (isCorrect) {
                      buttonClass += "bg-green-600 hover:bg-green-700 ring-2 ring-green-400 cursor-default";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "bg-red-600 hover:bg-red-700 ring-2 ring-red-400 cursor-default";
                    } else {
                      buttonClass += "bg-neutral-600 hover:bg-neutral-500 opacity-60 cursor-not-allowed";
                    }
                  } else {
                     buttonClass += "bg-neutral-700 hover:bg-neutral-600 focus:ring-2 focus:ring-amber-500";
                     if(isSelected && !answerFeedback) buttonClass += " ring-2 ring-amber-400 bg-amber-700"; 
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={showCorrectAnswer || (answerFeedback === 'correct')} 
                      className={buttonClass}
                      aria-pressed={isSelected}
                      aria-label={`Réponse: ${option}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              
              {showCorrectAnswer && answerFeedback === 'incorrect' && (
                 <div className="mt-auto pt-4">
                    <p className="text-red-300 text-lg font-semibold mb-1">Mauvaise réponse.</p>
                    <p className="text-slate-300 text-md mb-2">La capitale est <strong className="text-orange-300">{currentQuestion.capital}</strong>.</p>
                    <button 
                        onClick={handleNextQuestion}
                        className="w-full mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
                        aria-label={currentQuestionIndex < quizQuestions.length - 1 ? 'Passer à la question suivante' : 'Voir le score final'}
                    >
                        {currentQuestionIndex < quizQuestions.length - 1 ? 'Question Suivante' : 'Voir le Score Final'}
                    </button>
                 </div>
              )}
              {answerFeedback === 'correct' && showCorrectAnswer && (
                <div className="mt-auto pt-4">
                    <p className="text-green-300 text-lg font-semibold mb-2">Bonne réponse ! Passage à la question suivante...</p>
                </div>
              )}
               <div className="mt-auto pt-4 text-right">
                 <p className="text-xl font-semibold text-slate-200">Score: <span className="text-yellow-400">{score} / {quizQuestions.length}</span></p>
               </div>
            </div>
          )}

          {quizState === 'finished' && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-3xl font-bold mb-4 text-amber-400">Quiz Terminé!</h2>
              <p className="text-xl text-slate-200 mb-6">Votre score final est: <span className="font-bold text-yellow-300 text-2xl">{score} / {quizQuestions.length}</span></p>
              <button 
                onClick={generateQuizQuestions}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 text-lg"
                aria-label="Rejouer le quiz des capitales"
              >
                Rejouer
              </button>
            </div>
          )}
        </aside>
      </div>
      <footer className="mt-10 text-center text-neutral-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Quiz des Capitales. Globe interactif par D3.js & TopoJSON.</p>
      </footer>
    </div>
  );
};

export default App;
