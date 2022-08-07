import React, { useEffect, useState } from 'react';
import './App.css';

const WORD_LENGTH = 5;
let shakeLoop: null | HTMLAudioElement = null;
let words = new Array<string>();
function App() {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState(Array<string | null>(6).fill(null))
  const [currentGuess, setCurrentGuess] = useState('');
  const [numWins, setNumWins] = useState(0);

  /**
   * Clear the current board, maybe for a new word
   */
  const newBoard = (getNewWord: boolean = true) => {
    const randomWord = getNewWord ? words[Math.floor(Math.random() * words.length)] : solution;
    setSolution(randomWord);
    // Reset board / guesses
    setGuesses(new Array<string | null>(6).fill(null));
    setCurrentGuess('');
  }

  // Only fires on app startup due to empty arr 2nd param
  useEffect( () => {
    const fetchWords = async () => {
      const r = await fetch('words.txt').then(res => {
        return res.text();
      });
      words = (r.split("\r\n"));
      newBoard();
    }
    fetchWords();
  }, []);

  // handle typing
  useEffect(() => {
    const handleType = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (shakeLoop) {
          shakeLoop.pause();
          shakeLoop = null;
        }
        if (currentGuess.length !== 5) return;
        const isCorrect = solution.toLowerCase() === currentGuess.toLowerCase();
        const guessIdx = guesses.findIndex(val => val == null);
        guesses[guessIdx] = currentGuess.toLowerCase();
        setGuesses(guesses);
        setCurrentGuess('');
        if (isCorrect) { 
          setNumWins(oldNum => {
            return oldNum + 1;
          });
          const win = new Audio("win.mp3");
          win.play();
          setTimeout(() => {
            newBoard(true);
          }, 500);
        } else if (guessIdx == 5) {
          // Fail state
          const fail = new Audio("fail.mp3");
          fail.play();
          const ansDiv = document.getElementById("ansDiv")!;
          ansDiv.className += " visible";
          setNumWins(oldNum => {
            return oldNum - 1;
          });
          setTimeout(() => {
            newBoard();
            ansDiv.className = "";
          }, 2000)
        } else {
          const beep = new Audio("beep.mp3");
          beep.play();
        }
      }
      if (event.key === "Backspace") {
        if (shakeLoop) {
          shakeLoop.pause();
          shakeLoop = null;
        }
        const click = new Audio("click2.mp3");
        click.play();
        setCurrentGuess(currentGuess.slice(0, -1));
      }
      else if (currentGuess.length >= 5) {
        return;
      }
      else {
        const click = new Audio("click.mp3");
        click.play();
        setCurrentGuess(currentGuess + event.key);
      }
    };

    window.addEventListener('keydown', handleType);
    return () => window.removeEventListener('keydown', handleType);
  }, [currentGuess]);

  return (
    <div className="App">
      {
        // solution // debug
      }
      <div id="game">
        <div id="score">
          Score: {numWins}
        </div>
        <div className='board'>
          {
            guesses.map((g, i) => {
              const isCurrentGuess = i === guesses.findIndex(val => val == null);
              return (
                <Line key={i} 
                  guess={isCurrentGuess ? currentGuess : g ?? ''} 
                  isCurrentGuess={isCurrentGuess}
                  isFinal={!isCurrentGuess && g !== null}
                  solution={solution}
                />
              )
            })
          }
        </div>
        <div id="ansDiv">
          The answer was <span id="ans">{solution}</span>
        </div>
      </div>
      
    </div>
  );
}

export default App;

type LineProps = {
  guess: string | null,
  isFinal: boolean,
  solution: string,
  isCurrentGuess: boolean
};

function Line({ guess, isFinal, solution, isCurrentGuess }: LineProps) {
  const tiles = [];

  for (let i = 0; i < WORD_LENGTH; i++) {
    let char = guess ? guess[i] : '';
    if (char) char = char.toLowerCase();
    let className = 'tile';
    
    // If all 5 characters filled in, animate all
    if (isCurrentGuess && guess && guess.length == 5) {
      className += " readyTile";
      if (!shakeLoop) {
        shakeLoop = new Audio("shake.mp3");
        shakeLoop.loop = true;
        shakeLoop.play();
      }
    }
    if (guess && guess.length == i) className += " currentTile";
    else if (!guess && isCurrentGuess && i == 0) className += " currentTile";
    
    if (isFinal) {
      const solutionChar = solution[i].toLowerCase();
      if (solutionChar == char) className += " correct";
      else if (solution.includes(char)) className += " close";
      else className += " incorrect";
    }

    tiles.push(<div key={i} className={className}>{char}</div>)
  }

  return (
    <div className='line'>
      {
        tiles
      }
    </div>
  );
}
