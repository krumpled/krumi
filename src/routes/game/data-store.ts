import { fetch, post } from '@krumpled/krumi/krumnet';
import { Result, resultToPromise } from '@krumpled/krumi/std';
import debug from 'debug';

const log = debug('krumi:routes.game.data-store');

export type GameDetailRound = {
  id: string;
  prompt: string;
  position: number;
  completed: null | number;
  created: null | number;
  fulfilled: null | number;
  started: null | number;
};

export type GameDetailMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
};

export type GameDetailPlacement = {
  id: string;
  userName: string;
  place: number;
};

export type GameDetailResponse = {
  id: string;
  name: string;
  created: number;
  ended: number | null;
  members: Array<GameDetailMember>;
  rounds: Array<GameDetailRound>;
  placements: Array<GameDetailPlacement>;
};

export type RoundVote = {
  id: string;
  userId: string;
};

export type RoundEntry = {
  id: string;
  entry: string;
  memberId: string;
  roundId: string;
  userId: string;
  userName: string;
};

export type RoundDetailResponse = {
  id: string;
  created: number;
  completed: number | null;
  started: number | null;
  position: number;
  prompt: string;
  entries: Array<RoundEntry>;
  votes: Array<RoundVote>;
};

export type LobbyDetailResponse = {
  id: string;
  name: string;
};

export async function fetchLobby(lobbyId: string): Promise<Result<LobbyDetailResponse>> {
  const params = { ids: [lobbyId] };
  return (await fetch(`/lobbies`, params)) as Result<LobbyDetailResponse>;
}

export async function fetchGame(gameId: string): Promise<Result<GameDetailResponse>> {
  const params = { ids: [gameId] };
  return (await fetch(`/games`, params)) as Result<GameDetailResponse>;
}

export async function fetchRoundDetails(roundId: string): Promise<Result<RoundDetailResponse>> {
  const params = { ids: [roundId] };
  return (await fetch(`/rounds`, params)) as Result<RoundDetailResponse>;
}

export async function createEntry(roundId: string, entry: string): Promise<{ entry: string }> {
  log('creating entry "%s" for round "%s"', entry, roundId);
  const result = await post('/round-entries', { entry, roundId });
  return resultToPromise(result as Result<{ entry: string }>).then(() => ({ entry }));
}

export async function createVote(roundId: string, entryId: string): Promise<{ id: string }> {
  log('creating vote "%s" for round "%s"', entryId, roundId);
  const result = (await post('/round-entry-votes', { entryId, roundId })) as Result<{ id: string }>;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return resultToPromise(result);
}
