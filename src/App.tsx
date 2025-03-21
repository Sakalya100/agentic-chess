import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Info } from "lucide-react";

const providers = ["OpenAI", "Claude", "Gemini", "Mixtral"];

const chessTrivia = [
  "The longest official chess game in history lasted 269 moves (Nikolić vs Arsović, 1989)",
  "The number of possible unique chess games is greater than the number of atoms in the universe",
  "The first chess computer program was developed by Alan Turing in 1951",
  "The shortest possible chess game ending in checkmate takes just two moves",
  "The longest chess game theoretically possible is 5,949 moves",
  "The word 'Checkmate' comes from the Persian phrase 'Shah Mat' meaning 'the king is dead'",
  "Chess was invented in India around the 6th century AD",
  "The first chess tournament was held in London in 1851",
  "Magnus Carlsen became a chess grandmaster at the age of 13",
  "The queen piece was originally the vizier and was the weakest piece"
];

function App() {
  const [game] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [whiteModel, setWhiteModel] = useState("OpenAI");
  const [blackModel, setBlackModel] = useState("OpenAI");
  const [whiteKey, setWhiteKey] = useState("");
  const [blackKey, setBlackKey] = useState("");
  const [maxTurns, setMaxTurns] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState("");
  const [gameFinished, setGameFinished] = useState(false);
  const [currentTrivia, setCurrentTrivia] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [movesHistory, setMovesHistory] = useState<string[]>([]);

  useEffect(() => {
    let interval: number | null = null;
    if (isLoading && !gameStarted) {
      interval = window.setInterval(() => {
        setCurrentTrivia(prev => (prev + 1) % chessTrivia.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, gameStarted]);

  const resetGame = () => {
    game.reset();
    setPosition(game.fen());
    setGameFinished(false);
    setThinking("");
    setGameStarted(false);
    setMovesHistory([]);
  };

  const formatMove = (move: string): string => {
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);
    return `${from}-${to}`;
  };

  const startGame = async () => {
    setIsLoading(true);
    setThinking("Agents are getting ready...");
    setGameFinished(false);
    setGameStarted(false);
    setMovesHistory([]);
    game.reset();
    setPosition(game.fen());

    try {
      const response = await fetch("https://chess-agent-backend.onrender.com/play-chess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          white_model: whiteModel,
          black_model: blackModel,
          white_api_key: whiteKey,
          black_api_key: blackKey,
          max_turns: maxTurns
        })
      });

      const data = await response.json();
      const moves = data.move_history;
      setMovesHistory(moves);

      let i = 0;
      setGameStarted(true);
      
      const playMoves = () => {
        if (i < moves.length) {
          const currentTurn = i % 2 === 0 ? "White" : "Black";
          setThinking(`${currentTurn} is thinking...`);

          setTimeout(() => {
            const move = moves[i];
            game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: 'q' });
            setPosition(game.fen());
            i++;
            playMoves();
          }, 1000);
        } else {
          setThinking("");
          setIsLoading(false);
          setGameFinished(true);
        }
      };

      playMoves();
    } catch (error) {
      console.error("Error fetching moves:", error);
      setThinking("Failed to load moves.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-3xl font-light text-center text-gray-800">AI Chess Match</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">White Player</label>
              <select
                value={whiteModel}
                onChange={(e) => setWhiteModel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="password"
                placeholder="API Key"
                value={whiteKey}
                onChange={(e) => setWhiteKey(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Black Player</label>
              <select
                value={blackModel}
                onChange={(e) => setBlackModel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="password"
                placeholder="API Key"
                value={blackKey}
                onChange={(e) => setBlackKey(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-600">Max Turns</label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                    Higher turns = Higher API costs. Use 200+ for complete games.
                  </div>
                </div>
              </div>
              <input
                type="number"
                min="1"
                value={maxTurns}
                onChange={(e) => setMaxTurns(Math.max(1, parseInt(e.target.value)))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Game in Progress..." : "Start Game"}
              </button>

              {gameFinished && (
                <button
                  onClick={resetGame}
                  className="flex-1 px-4 py-2 text-black bg-white border border-black rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                >
                  Reset
                </button>
              )}
            </div>

            {isLoading && (
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">{thinking}</p>
                  {!gameStarted && (
                    <p className="text-sm text-gray-500 italic">{chessTrivia[currentTrivia]}</p>
                  )}
                </div>
              </div>
            )}

            {gameFinished && movesHistory.length > 0 && (
              <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Game Moves</h3>
                <div className="grid grid-cols-2 gap-2">
                  {movesHistory.map((move, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'
                      }`}
                    >
                      {index + 1}. {index % 2 === 0 ? 'White' : 'Black'}: {formatMove(move)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-full aspect-square">
            <Chessboard position={position} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;