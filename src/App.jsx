import { useState, useEffect } from "react";
import words from "./words4.json";
import "./App.css";

const wordSet = new Set(words);
const wordArray = Array.from(wordSet);

function isWordValid(inputWord, prevWord) {
  if (inputWord.length !== 4) {
    alert("Word must be 4 letters. Enter a new word.");
    return false;
  }

  let key = 0;

  for (let i = 0; i < 4; i++) {
    if (prevWord[i] !== inputWord[i]) {
      key++;
    }
  }

  if (key !== 1) {
    alert("Invalid input. Change exactly one letter.");
    return false;
  }

  return true;
}

function isEnglishWord(word) {
  return wordSet.has(word.trim().toLowerCase());
}

function getRandomWord() {
  const randomIdx = Math.floor(Math.random() * wordArray.length);
  return wordArray[randomIdx];
}

function isOneLetterApart(word1, word2) {
  let differences = 0;

  for (let i = 0; i < 4; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
    }
  }

  return differences === 1;
}

function getRandomPair() {
  const path = [getRandomWord()];
  const usedWords = new Set(path);

  // Generate a path containing up to 6 words.
  for (let i = 0; i < 5; i++) {
    const current = path[path.length - 1];

    const neighbors = wordArray.filter(
      (word) => !usedWords.has(word) && isOneLetterApart(current, word),
    );

    if (neighbors.length === 0) {
      break;
    }

    const randomIdx = Math.floor(Math.random() * neighbors.length);
    const next = neighbors[randomIdx];

    path.push(next);
    usedWords.add(next);
  }

  return {
    start: path[0],
    target: path[path.length - 1],
  };
}

function App() {
  const [word1, setWord1] = useState("");
  const [word2, setWord2] = useState("");
  const [userInput, setUserInput] = useState("");
  const [wordChain, setWordChain] = useState([]);
  const [gameWon, setGameWon] = useState(false);

  // Load saved statistics from localStorage
  const [stats, setStats] = useState(() => {
    try {
      const savedStats = localStorage.getItem("wordLadderStats");

      return savedStats
        ? JSON.parse(savedStats)
        : {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0,
          };
    } catch {
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        totalMoves: 0,
      };
    }
  });

  // Save statistics whenever they change
  useEffect(() => {
    localStorage.setItem("wordLadderStats", JSON.stringify(stats));
  }, [stats]);

  function recordGame(won, moves = 0) {
    setStats((prevStats) => ({
      gamesPlayed: prevStats.gamesPlayed + 1,
      gamesWon: prevStats.gamesWon + (won ? 1 : 0),
      totalMoves: prevStats.totalMoves + (won ? moves : 0),
    }));
  }

  function startNewGame() {
    // An unfinished game is recorded as a loss.
    // A game already won was recorded when the player won.
    if (wordChain.length > 0 && !gameWon) {
      recordGame(false);
    }

    const pair = getRandomPair();

    setWord1(pair.start);
    setWord2(pair.target);
    setWordChain([pair.start]);
    setUserInput("");
    setGameWon(false);
  }

  function handleSubmit() {
    if (gameWon || wordChain.length === 0) {
      return;
    }

    const word = userInput.trim().toLowerCase();
    const prevWord = wordChain[wordChain.length - 1];

    if (!isWordValid(word, prevWord)) {
      return;
    }

    if (!isEnglishWord(word)) {
      alert("Word not found in the dictionary!");
      return;
    }

    setWordChain((prevChain) => [...prevChain, word]);
    setUserInput("");

    if (word === word2) {
      setGameWon(true);

      // The current chain length equals the moves
      // needed to reach the target.
      recordGame(true, wordChain.length);
    }
  }

  useEffect(() => {
    startNewGame();
  }, []);

  const winRate =
    stats.gamesPlayed === 0 ? 0 : (stats.gamesWon / stats.gamesPlayed) * 100;

  const averageMoves =
    stats.gamesWon === 0 ? 0 : stats.totalMoves / stats.gamesWon;

  return (
    <div className="app">
      <main className="game-container">
        <header className="game-header">
          <h1 className="eyebrow">WORD LADDER</h1>

          <p className="subtitle">
            Change one letter at a time to reach the target word.
          </p>
        </header>

        <section className="stats">
          <h2>Your Statistics</h2>

          <div className="stats-grid">
            <div className="stat-item">
              <span>Played: </span>
              <strong>{stats.gamesPlayed}</strong>
            </div>

            <div className="stat-item">
              <span>Won: </span>
              <strong>{stats.gamesWon}</strong>
            </div>

            <div className="stat-item">
              <span>Win rate: </span>
              <strong>{winRate.toFixed(1)}%</strong>
            </div>

            <div className="stat-item">
              <span>Avg. moves: </span>
              <strong>{averageMoves.toFixed(1)}</strong>
            </div>
          </div>
        </section>

        <section className="word-display">
          <div className="word-box">
            <span>Starting word</span>
            <strong>{word1.toUpperCase()}</strong>
          </div>

          <div className="arrow">→</div>

          <div className="word-box target-box">
            <span>Target word</span>
            <strong>{word2.toUpperCase()}</strong>
          </div>
        </section>

        <section className="word-chain">
          <h2>Word Chain</h2>

          <div className="chain-list">
            {wordChain.map((word, index) => (
              <div className="chain-word" key={index}>
                <span>{word.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>

        <form
          className="word-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <label htmlFor="word-input">Enter next word</label>

          <input
            id="word-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={gameWon || wordChain.length === 0}
            placeholder="e.g. COLD"
            maxLength={4}
            autoComplete="off"
          />

          <button type="submit" disabled={gameWon || wordChain.length === 0}>
            Submit Word
          </button>
        </form>

        {gameWon && <p className="win-message">Target Word Reached !!</p>}

        <br></br>
        <button className="new-game-button" onClick={startNewGame}>
          New Game
        </button>
      </main>
    </div>
  );
}

export default App;
