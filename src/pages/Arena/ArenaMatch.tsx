import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArenaService } from '../../services/arenaService';
import { useAuth } from '../../context/AuthContext';
import { ArenaMatch as ArenaMatchType, MatchStatus } from '../../types/arena.types';

export const ArenaMatch: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState<ArenaMatchType | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!matchId) return;

    unsubscribeRef.current = ArenaService.subscribeToMatch(matchId, (matchData) => {
      setMatch(matchData);
      setIsHost(matchData.hostId === user?.id);

      if (matchData.status === MatchStatus.STARTING && !countdown) {
        startCountdown();
      }

      if (matchData.status === MatchStatus.IN_PROGRESS && countdown === 0) {
        initializeGame();
      }

      if (matchData.status === MatchStatus.FINISHED) {
        handleMatchEnd();
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [matchId, user]);

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStartMatch = async () => {
    if (!matchId || !isHost) return;

    try {
      await ArenaService.startMatch(matchId);
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  const handleLeaveMatch = async () => {
    if (!matchId || !user?.id) return;

    try {
      await ArenaService.leaveMatch(matchId, user.id);
      navigate('/arena');
    } catch (error) {
      console.error('Error leaving match:', error);
    }
  };

  const initializeGame = () => {
    console.log('🎮 Initializing Phaser game...');
  };

  const handleMatchEnd = () => {
    setTimeout(() => {
      navigate('/arena/results');
    }, 3000);
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading match...</p>
        </div>
      </div>
    );
  }

  if (match.status === MatchStatus.WAITING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">⏳ Waiting for Players</h1>
              <p className="text-gray-300">
                {match.players.length}/{match.maxPlayers} players ready
              </p>
            </div>

            <div className="mb-8">
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-white font-bold mb-2">Game Info</h3>
                <p className="text-gray-300">Mode: {match.mode.replace('_', ' ').toUpperCase()}</p>
                <p className="text-gray-300">Map: {match.map.replace('_', ' ')}</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-bold mb-3">Players</h3>
                {match.mode === 'team' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-blue-400 font-bold mb-2">🔵 Team A</h4>
                      {match.players.filter(p => p.team === 'A').map((player, i) => (
                        <div key={i} className="bg-blue-900 bg-opacity-30 rounded p-2 mb-2">
                          <span className="text-white font-bold">{player.username}</span>
                          <p className="text-gray-400 text-xs">{player.character.replace('_', ' ')}</p>
                        </div>
                      ))}
                      {Array.from({ length: Math.ceil(match.maxPlayers / 2) - match.players.filter(p => p.team === 'A').length }).map((_, i) => (
                        <div key={`a-empty-${i}`} className="bg-gray-800 rounded p-2 mb-2 border border-dashed border-gray-600">
                          <p className="text-gray-500 text-xs">Waiting...</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-red-400 font-bold mb-2">🔴 Team B</h4>
                      {match.players.filter(p => p.team === 'B').map((player, i) => (
                        <div key={i} className="bg-red-900 bg-opacity-30 rounded p-2 mb-2">
                          <span className="text-white font-bold">{player.username}</span>
                          <p className="text-gray-400 text-xs">{player.character.replace('_', ' ')}</p>
                        </div>
                      ))}
                      {Array.from({ length: Math.floor(match.maxPlayers / 2) - match.players.filter(p => p.team === 'B').length }).map((_, i) => (
                        <div key={`b-empty-${i}`} className="bg-gray-800 rounded p-2 mb-2 border border-dashed border-gray-600">
                          <p className="text-gray-500 text-xs">Waiting...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {match.players.map((player, i) => (
                      <div key={i} className="bg-gray-800 rounded p-3">
                        <span className="text-white font-bold">{player.username}</span>
                        <p className="text-gray-400 text-sm mt-1">
                          {player.character.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                    {Array.from({ length: match.maxPlayers - match.players.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-gray-800 rounded p-3 border-2 border-dashed border-gray-600">
                        <p className="text-gray-500 text-center">Waiting...</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              {isHost && match.players.length >= 2 && (
                <button
                  onClick={handleStartMatch}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  🚀 Start Match
                </button>
              )}
              <button
                onClick={handleLeaveMatch}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                ❌ Leave Match
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl font-bold text-white animate-pulse mb-4">
            {countdown}
          </div>
          <p className="text-2xl text-gray-300">Get Ready!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <div
        ref={gameContainerRef}
        id="phaser-game"
        className="w-full h-full"
      />

      <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded p-4">
        <div className="text-white">
          <p className="font-bold mb-1">Players: {match.players.length}</p>
          {match.players.map((p, i) => (
            <div key={i} className="text-sm">
              {p.username}: {p.kills}/{p.deaths}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleLeaveMatch}
        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Leave
      </button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded px-6 py-2">
        <p className="text-white text-xl font-bold">
          Coming Soon: Full Phaser.js Game
        </p>
      </div>
    </div>
  );
};

export default ArenaMatch;
