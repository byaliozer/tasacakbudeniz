const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://denizquiz.emergent.host';

export interface Episode {
  id: number;
  name: string;
  question_count: number;
  is_locked: boolean;
  description: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correct_option: string;
  difficulty: string;
  points: number;
}

export interface QuizResponse {
  episode_id: number;
  episode_name: string;
  questions: Question[];
  total_questions: number;
  max_possible_score: number;
}

export interface LeaderboardEntry {
  rank: number;
  player_name: string;
  score: number;
  timestamp: string;
}

export interface LeaderboardResponse {
  top_10: LeaderboardEntry[];
  player_rank: number | null;
  player_entry: LeaderboardEntry | null;
  total_players: number;
}

export async function getEpisodes(): Promise<Episode[]> {
  const response = await fetch(`${API_URL}/api/episodes`);
  if (!response.ok) throw new Error('Failed to fetch episodes');
  return response.json();
}

export async function startQuiz(episodeId: number, count: number = 20): Promise<QuizResponse> {
  const response = await fetch(`${API_URL}/api/quiz/${episodeId}?count=${count}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start quiz');
  }
  return response.json();
}

export async function saveScore(episodeId: number, playerName: string, score: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ episode_id: episodeId, player_name: playerName, score }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to save score');
  }
}

export async function getLeaderboard(episodeId: number, playerName?: string): Promise<LeaderboardResponse> {
  let url = `${API_URL}/api/leaderboard/${episodeId}`;
  if (playerName) url += `?player_name=${encodeURIComponent(playerName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}
