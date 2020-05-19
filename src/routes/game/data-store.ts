import { fetch, post } from '@krumpled/krumi/krumnet';
import { Result } from '@krumpled/krumi/std';
import debug from 'debug';

const log = debug('krumi:routes.game.data-store');

export type GameDetailRound = {
  id: string;
  prompt: string;
  completed: null | number;
  started: null | number;
  position: number;
};

export type GameDetailMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
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
};

export type GameDetailResponse = {
  id: string;
  created: string;
  members: Array<GameDetailMember>;
  rounds: Array<GameDetailRound>;
};

export async function fetchGame(
  gameId: string,
): Promise<Result<GameDetailResponse>> {
  const params = { ids: [gameId] };
  return (await fetch(`/games`, params)) as Result<GameDetailResponse>;
}

export async function fetchRoundDetails(
  roundId: string,
): Promise<Result<RoundDetailResponse>> {
  const params = { ids: [roundId] };
  return (await fetch(`/rounds`, params)) as Result<RoundDetailResponse>;
}

export async function createEntry(
  roundId: string,
  entry: string,
): Promise<{ entry: string }> {
  log('creating entry "%s" for round "%s"', entry, roundId);

  const result = await post('/round-entries', { entry, roundId });

  if (result.kind === 'err') {
    const [e] = result.errors;
    return Promise.reject(e);
  }

  return Promise.resolve({ entry });
}
