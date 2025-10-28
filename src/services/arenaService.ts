import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  ArenaMatch,
  ArenaPlayer,
  MatchResult,
  PlayerArenaStats,
  DailyMission,
  Leaderboard,
  GameEvent,
  GameMode,
  MapType,
  CharacterClass,
  MatchStatus,
  CHARACTER_CONFIGS,
} from '../types/arena.types';

const COLLECTIONS = {
  MATCHES: 'arena_matches',
  STATS: 'arena_player_stats',
  RESULTS: 'arena_match_results',
  MISSIONS: 'arena_daily_missions',
  LEADERBOARD: 'arena_leaderboard',
  EVENTS: 'arena_game_events',
};

function removeUndefined<T>(obj: T): T {
  const cleaned = {} as any;
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as T;
}

function cleanPlayerData(player: ArenaPlayer): any {
  const cleaned: any = {
    userId: player.userId,
    username: player.username,
    character: player.character,
    hp: player.hp,
    maxHp: player.maxHp,
    shield: player.shield,
    kills: player.kills,
    deaths: player.deaths,
    score: player.score,
    position: player.position,
    currentWeapon: player.currentWeapon,
    activePowerUps: player.activePowerUps,
    isAlive: player.isAlive,
  };

  if (player.team) {
    cleaned.team = player.team;
  }

  if (player.secondaryWeapon) {
    cleaned.secondaryWeapon = player.secondaryWeapon;
  }

  if (player.respawnTime) {
    cleaned.respawnTime = player.respawnTime;
  }

  return cleaned;
}

export class ArenaService {
  static async createMatch(
    hostId: string,
    mode: GameMode,
    map: MapType,
    maxPlayers: number = 8
  ): Promise<string> {
    const matchId = doc(collection(db, COLLECTIONS.MATCHES)).id;

    const match: ArenaMatch = {
      matchId,
      mode,
      map,
      status: MatchStatus.WAITING,
      players: [],
      maxPlayers,
      hostId,
      duration: 300,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(doc(db, COLLECTIONS.MATCHES, matchId), match);
    return matchId;
  }

  static async joinMatch(
    matchId: string,
    userId: string,
    username: string,
    character: CharacterClass
  ): Promise<boolean> {
    try {
      const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }

      const match = matchDoc.data() as ArenaMatch;

      if (match.players.length >= match.maxPlayers) {
        throw new Error('Match is full');
      }

      if (match.status !== MatchStatus.WAITING) {
        throw new Error('Match already started');
      }

      if (match.players.some(p => p.userId === userId)) {
        throw new Error('Already in match');
      }

      const characterStats = CHARACTER_CONFIGS[character];

      const playerBase = {
        userId,
        username,
        character,
        hp: characterStats.hp,
        maxHp: characterStats.hp,
        shield: 0,
        kills: 0,
        deaths: 0,
        score: 0,
        position: {
          x: 0,
          y: 0,
          velocityX: 0,
          velocityY: 0,
          direction: 'right' as const,
        },
        currentWeapon: characterStats.startingWeapon,
        activePowerUps: [],
        isAlive: true,
      };

      const newPlayer: ArenaPlayer = match.mode === GameMode.TEAM_BATTLE
        ? {
            ...playerBase,
            team: (match.players.length % 2 === 0 ? 'A' : 'B') as 'A' | 'B'
          }
        : playerBase as ArenaPlayer;

      const cleanedPlayers = [...match.players.map(cleanPlayerData), cleanPlayerData(newPlayer)];

      await updateDoc(matchRef, {
        players: cleanedPlayers,
        updatedAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error('Error joining match:', error);
      throw error;
    }
  }

  static async leaveMatch(matchId: string, userId: string): Promise<void> {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) return;

    const match = matchDoc.data() as ArenaMatch;
    const updatedPlayers = match.players.filter(p => p.userId !== userId);

    if (updatedPlayers.length === 0) {
      await updateDoc(matchRef, {
        status: MatchStatus.CANCELLED,
        updatedAt: Date.now(),
      });
    } else {
      await updateDoc(matchRef, {
        players: updatedPlayers.map(cleanPlayerData),
        hostId: match.hostId === userId ? updatedPlayers[0].userId : match.hostId,
        updatedAt: Date.now(),
      });
    }
  }

  static async startMatch(matchId: string): Promise<void> {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    await updateDoc(matchRef, {
      status: MatchStatus.IN_PROGRESS,
      startTime: Date.now(),
      updatedAt: Date.now(),
    });
  }

  static async updatePlayerState(
    matchId: string,
    userId: string,
    updates: Partial<ArenaPlayer>
  ): Promise<void> {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) return;

    const match = matchDoc.data() as ArenaMatch;
    const updatedPlayers = match.players.map(p =>
      p.userId === userId ? { ...p, ...updates } : p
    );

    await updateDoc(matchRef, {
      players: updatedPlayers.map(cleanPlayerData),
      updatedAt: Date.now(),
    });
  }

  static async recordKill(
    matchId: string,
    killerId: string,
    victimId: string
  ): Promise<void> {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) return;

    const match = matchDoc.data() as ArenaMatch;
    const updatedPlayers = match.players.map(p => {
      if (p.userId === killerId) {
        return { ...p, kills: p.kills + 1, score: p.score + 100 };
      }
      if (p.userId === victimId) {
        return { ...p, deaths: p.deaths + 1, score: Math.max(0, p.score - 10), isAlive: false, respawnTime: Date.now() + 3000 };
      }
      return p;
    });

    await updateDoc(matchRef, {
      players: updatedPlayers.map(cleanPlayerData),
      updatedAt: Date.now(),
    });

    const eventId = doc(collection(db, COLLECTIONS.EVENTS)).id;
    const event: GameEvent = {
      eventId,
      matchId,
      type: 'kill',
      playerId: killerId,
      targetId: victimId,
      data: {},
      timestamp: Date.now(),
    };

    await setDoc(doc(db, COLLECTIONS.EVENTS, eventId), event);
  }

  static async endMatch(matchId: string): Promise<void> {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) return;

    const match = matchDoc.data() as ArenaMatch;

    let winnerId: string | undefined;
    let winnerTeam: 'A' | 'B' | undefined;

    if (match.mode === GameMode.TEAM_BATTLE) {
      const teamAScore = match.players
        .filter(p => p.team === 'A')
        .reduce((sum, p) => sum + p.score, 0);
      const teamBScore = match.players
        .filter(p => p.team === 'B')
        .reduce((sum, p) => sum + p.score, 0);
      winnerTeam = teamAScore > teamBScore ? 'A' : 'B';
    } else {
      const sortedPlayers = [...match.players].sort((a, b) => b.score - a.score);
      winnerId = sortedPlayers[0]?.userId;
    }

    await updateDoc(matchRef, {
      status: MatchStatus.FINISHED,
      endTime: Date.now(),
      winnerId,
      winnerTeam,
      updatedAt: Date.now(),
    });

    await this.saveMatchResult(match, winnerId, winnerTeam);
    await this.updatePlayerStats(match, winnerId, winnerTeam);
  }

  private static async saveMatchResult(
    match: ArenaMatch,
    winnerId?: string,
    winnerTeam?: 'A' | 'B'
  ): Promise<void> {
    const resultId = doc(collection(db, COLLECTIONS.RESULTS)).id;

    const playerStats = match.players.map((p, index) => {
      const isWinner = match.mode === GameMode.TEAM_BATTLE
        ? p.team === winnerTeam
        : p.userId === winnerId;

      const basePupfi = isWinner ? 150 : 50;
      const killBonus = p.kills * 10;
      const pupfiEarned = basePupfi + killBonus;

      return {
        userId: p.userId,
        username: p.username,
        kills: p.kills,
        deaths: p.deaths,
        damage: p.kills * 100,
        score: p.score,
        placement: index + 1,
        team: p.team,
        pupfiEarned,
        xpEarned: p.score,
      };
    });

    const result: MatchResult = {
      matchId: match.matchId,
      mode: match.mode,
      map: match.map,
      duration: match.endTime && match.startTime ? match.endTime - match.startTime : 0,
      playerStats,
      winnerId,
      winnerTeam,
      timestamp: Date.now(),
    };

    await setDoc(doc(db, COLLECTIONS.RESULTS, resultId), result);
  }

  private static async updatePlayerStats(
    match: ArenaMatch,
    winnerId?: string,
    winnerTeam?: 'A' | 'B'
  ): Promise<void> {
    const batch = writeBatch(db);

    for (const player of match.players) {
      const statsRef = doc(db, COLLECTIONS.STATS, player.userId);
      const statsDoc = await getDoc(statsRef);

      const isWinner = match.mode === GameMode.TEAM_BATTLE
        ? player.team === winnerTeam
        : player.userId === winnerId;

      if (statsDoc.exists()) {
        batch.update(statsRef, {
          totalMatches: increment(1),
          wins: isWinner ? increment(1) : increment(0),
          losses: isWinner ? increment(0) : increment(1),
          totalKills: increment(player.kills),
          totalDeaths: increment(player.deaths),
          totalDamage: increment(player.kills * 100),
          xp: increment(player.score),
          pupfiEarned: increment(player.kills * 10 + (isWinner ? 150 : 50)),
          lastPlayed: Date.now(),
        });
      } else {
        const newStats: PlayerArenaStats = {
          userId: player.userId,
          username: player.username,
          level: 1,
          xp: player.score,
          rank: 'Bronze',
          mmr: 1000,
          totalMatches: 1,
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
          totalKills: player.kills,
          totalDeaths: player.deaths,
          totalDamage: player.kills * 100,
          totalPlaytime: match.endTime && match.startTime ? match.endTime - match.startTime : 0,
          favoriteCharacter: player.character,
          favoriteWeapon: player.currentWeapon,
          highestKillStreak: player.kills,
          pupfiEarned: player.kills * 10 + (isWinner ? 150 : 50),
          unlockedCharacters: [CharacterClass.SCOUT],
          unlockedWeapons: [],
          unlockedSkins: [],
          lastPlayed: Date.now(),
          createdAt: Date.now(),
        };
        batch.set(statsRef, newStats);
      }
    }

    await batch.commit();
  }

  static async getPlayerStats(userId: string): Promise<PlayerArenaStats | null> {
    const statsDoc = await getDoc(doc(db, COLLECTIONS.STATS, userId));
    if (!statsDoc.exists()) return null;
    return statsDoc.data() as PlayerArenaStats;
  }

  static async getActiveMatches(mode?: GameMode): Promise<ArenaMatch[]> {
    try {
      let constraints: any[] = [
        where('status', 'in', [MatchStatus.WAITING, MatchStatus.STARTING])
      ];

      if (mode) {
        constraints.push(where('mode', '==', mode));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(20));

      const q = query(collection(db, COLLECTIONS.MATCHES), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ArenaMatch);
    } catch (error) {
      console.error('Error loading matches:', error);

      // Fallback: load all waiting/starting matches without ordering
      try {
        const q = query(
          collection(db, COLLECTIONS.MATCHES),
          where('status', 'in', [MatchStatus.WAITING, MatchStatus.STARTING]),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const matches = snapshot.docs.map(doc => doc.data() as ArenaMatch);

        // Filter by mode if specified
        if (mode) {
          return matches.filter(m => m.mode === mode);
        }
        return matches;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }

  static async getMatchHistory(userId: string, limitCount: number = 10): Promise<MatchResult[]> {
    const q = query(
      collection(db, COLLECTIONS.RESULTS),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => doc.data() as MatchResult);

    return results.filter(result =>
      result.playerStats.some(p => p.userId === userId)
    );
  }

  static async getLeaderboard(season: string = 'current', limitCount: number = 100): Promise<Leaderboard[]> {
    const q = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      where('season', '==', season),
      orderBy('mmr', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Leaderboard);
  }

  static subscribeToMatch(matchId: string, callback: (match: ArenaMatch) => void) {
    const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
    return onSnapshot(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ArenaMatch);
      }
    });
  }

  static async getDailyMissions(userId: string): Promise<DailyMission[]> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, COLLECTIONS.MISSIONS),
      where('userId', '==', userId),
      where('date', '==', today)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return await this.generateDailyMissions(userId, today);
    }

    return snapshot.docs.map(doc => doc.data() as DailyMission);
  }

  private static async generateDailyMissions(userId: string, date: string): Promise<DailyMission[]> {
    const missions = [
      {
        missionId: `${userId}_${date}_1`,
        userId,
        description: 'Play 3 matches',
        requirement: 3,
        progress: 0,
        reward: 50,
        completed: false,
        date,
      },
      {
        missionId: `${userId}_${date}_2`,
        userId,
        description: 'Get 10 kills',
        requirement: 10,
        progress: 0,
        reward: 100,
        completed: false,
        date,
      },
      {
        missionId: `${userId}_${date}_3`,
        userId,
        description: 'Win 1 match',
        requirement: 1,
        progress: 0,
        reward: 150,
        completed: false,
        date,
      },
    ];

    const batch = writeBatch(db);
    missions.forEach(mission => {
      batch.set(doc(db, COLLECTIONS.MISSIONS, mission.missionId), mission);
    });
    await batch.commit();

    return missions;
  }

  static async updateMissionProgress(
    userId: string,
    missionType: 'play' | 'kill' | 'win',
    amount: number = 1
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const missions = await this.getDailyMissions(userId);

    const missionMap: Record<string, string> = {
      play: `${userId}_${today}_1`,
      kill: `${userId}_${today}_2`,
      win: `${userId}_${today}_3`,
    };

    const missionId = missionMap[missionType];
    const mission = missions.find(m => m.missionId === missionId);

    if (mission && !mission.completed) {
      const newProgress = mission.progress + amount;
      const completed = newProgress >= mission.requirement;

      await updateDoc(doc(db, COLLECTIONS.MISSIONS, missionId), {
        progress: newProgress,
        completed,
      });

      if (completed) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          pupfi: increment(mission.reward),
        });
      }
    }
  }
}
