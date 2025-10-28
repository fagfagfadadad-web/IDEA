import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArenaService } from '../../services/arenaService';
import { useAuth } from '../../context/AuthContext';
import {
  GameMode,
  MapType,
  CharacterClass,
  ArenaMatch,
  MatchStatus,
} from '../../types/arena.types';

export const ArenaLobby: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMatches, setActiveMatches] = useState<ArenaMatch[]>([]);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.FREE_FOR_ALL);
  const [selectedMap, setSelectedMap] = useState<MapType>(MapType.CLASSIC_ARENA);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterClass>(CharacterClass.SCOUT);
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveMatches();
    const interval = setInterval(loadActiveMatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveMatches = async () => {
    try {
      // Load ALL active matches, not filtered by mode
      const matches = await ArenaService.getActiveMatches();
      setActiveMatches(matches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!user?.id) return;

    setIsCreatingMatch(true);
    try {
      const matchId = await ArenaService.createMatch(
        user.id,
        selectedMode,
        selectedMap,
        maxPlayers
      );

      await ArenaService.joinMatch(matchId, user.id, user.username || 'Player', selectedCharacter);

      navigate(`/arena/match/${matchId}`);
    } catch (error) {
      console.error('Error creating match:', error);
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    if (!user?.id) return;

    try {
      await ArenaService.joinMatch(matchId, user.id, user.username || 'Player', selectedCharacter);
      navigate(`/arena/match/${matchId}`);
    } catch (error: any) {
      console.error('Error joining match:', error);
      alert(error.message || 'Failed to join match');
    }
  };

  const handleQuickPlay = async () => {
    if (!user?.id) return;

    const availableMatch = activeMatches.find(
      m => m.players.length < m.maxPlayers && m.status === MatchStatus.WAITING
    );

    if (availableMatch) {
      await handleJoinMatch(availableMatch.matchId);
    } else {
      await handleCreateMatch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🎮 PupFi Arena</h1>
          <p className="text-xl text-gray-300">Join the battle and prove your skills!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">⚙️ Game Settings</h2>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Game Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => {
                  const mode = e.target.value as GameMode;
                  setSelectedMode(mode);
                  if (mode === GameMode.TEAM_BATTLE) {
                    setMaxPlayers(2);
                  } else {
                    setMaxPlayers(8);
                  }
                }}
                className="w-full bg-gray-700 text-white rounded p-2"
              >
                <option value={GameMode.FREE_FOR_ALL}>Free For All</option>
                <option value={GameMode.TEAM_BATTLE}>Team Battle (1v1)</option>
                <option value={GameMode.BATTLE_ROYALE}>Battle Royale</option>
                <option value={GameMode.SURVIVAL}>Survival Mode</option>
              </select>
            </div>

            {selectedMode === GameMode.TEAM_BATTLE && (
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Team Size</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full bg-gray-700 text-white rounded p-2"
                >
                  <option value={2}>1v1 (2 players)</option>
                  <option value={4}>2v2 (4 players)</option>
                  <option value={6}>3v3 (6 players)</option>
                  <option value={8}>4v4 (8 players)</option>
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Select Map</label>
              <select
                value={selectedMap}
                onChange={(e) => setSelectedMap(e.target.value as MapType)}
                className="w-full bg-gray-700 text-white rounded p-2"
              >
                <option value={MapType.CLASSIC_ARENA}>Classic Arena</option>
                <option value={MapType.SPACE_STATION}>Space Station</option>
                <option value={MapType.JUNGLE_TEMPLE}>Jungle Temple</option>
                <option value={MapType.LAVA_BASE}>Lava Base</option>
                <option value={MapType.CYBER_GRID}>Cyber Grid</option>
                <option value={MapType.FROZEN_CAVE}>Frozen Cave</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Choose Character</label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value as CharacterClass)}
                className="w-full bg-gray-700 text-white rounded p-2"
              >
                <option value={CharacterClass.SCOUT}>🟢 Scout - Fast & Agile</option>
                <option value={CharacterClass.TANK}>🔵 Tank - High HP</option>
                <option value={CharacterClass.BLASTER}>🔴 Blaster - Damage Dealer</option>
                <option value={CharacterClass.TRICKSTER}>🟣 Trickster - Teleport</option>
                <option value={CharacterClass.SNIPER}>🟡 Sniper - Long Range</option>
                <option value={CharacterClass.ENGINEER}>🟠 Engineer - Turrets</option>
                <option value={CharacterClass.HEALER}>⚪ Healer - Support</option>
                <option value={CharacterClass.ASSASSIN}>⚫ Assassin - Stealth</option>
              </select>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleQuickPlay}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                ⚡ Quick Play
              </button>
              <button
                onClick={handleCreateMatch}
                disabled={isCreatingMatch}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {isCreatingMatch ? 'Creating...' : '🎮 Create Match'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">🔥 Active Matches</h2>
              <span className="text-gray-400 text-sm">All game modes</span>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                Loading matches...
              </div>
            ) : activeMatches.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-xl mb-2">No active matches found</p>
                <p>Be the first to create one!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activeMatches.map((match) => (
                  <div
                    key={match.matchId}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold">
                            {match.mode.replace('_', ' ').toUpperCase()}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            match.mode === 'team' ? 'bg-purple-600 text-white' :
                            match.mode === 'ffa' ? 'bg-orange-600 text-white' :
                            match.mode === 'battle_royale' ? 'bg-red-600 text-white' :
                            'bg-green-600 text-white'
                          }`}>
                            {match.mode === 'team' ? `${match.maxPlayers / 2}v${match.maxPlayers / 2}` :
                             match.mode === 'ffa' ? 'FFA' :
                             match.mode === 'battle_royale' ? 'BR' : 'SURV'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Map: {match.map.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          {match.players.length}/{match.maxPlayers}
                        </p>
                        <p className="text-gray-400 text-sm">Players</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {match.players.map((player, i) => (
                        <span
                          key={i}
                          className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {player.username}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleJoinMatch(match.matchId)}
                      disabled={match.players.length >= match.maxPlayers}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
                    >
                      {match.players.length >= match.maxPlayers ? 'Full' : 'Join Match'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-white font-bold mb-1">Your Rank</h3>
            <p className="text-gray-400">Coming Soon</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">⚔️</div>
            <h3 className="text-white font-bold mb-1">Total Kills</h3>
            <p className="text-gray-400">Coming Soon</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="text-white font-bold mb-1">Win Rate</h3>
            <p className="text-gray-400">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaLobby;
