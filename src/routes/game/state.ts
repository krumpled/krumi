import {
  unwrapOptionOr,
  mapOption,
  loaded,
  fromNullable,
  notAsked,
  Option,
  AsyncRequest,
} from '@krumpled/krumi/std';
import { useParams } from 'react-router-dom';
import {
  empty,
  RoundSubmission,
} from '@krumpled/krumi/routes/game/round-submission';

export type State = {
  lobbyId: string;
  gameId: string;
  gameState: AsyncRequest<GameState>;
};

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

export type GameDetailResponse = {
  id: string;
  created: string;
  members: Array<GameDetailMember>;
  rounds: Array<GameDetailRound>;
};

export type ActiveRound = {
  round: GameDetailRound;
  submission: RoundSubmission;
};

export type GameState = {
  lobby: { id: string };
  game: GameDetailResponse;
  activeRound: Option<ActiveRound>;
};

export function init(): State {
  const { lobbyId, gameId } = useParams();
  return { lobbyId, gameId, gameState: notAsked() };
}

function isActive({ completed, started }: GameDetailRound): boolean {
  const now = new Date().getTime();

  if (!started || completed) {
    return false;
  }

  return started < now;
}

export function findActiveRound(
  rounds: Array<GameDetailRound>,
): Option<GameDetailRound> {
  const active = fromNullable(rounds.find(isActive));
  return active;
}

export function changedActiveRound(
  { gameState: current }: State,
  { gameState: next }: State,
): boolean {
  if (current.kind !== 'loaded' || next.kind !== 'loaded') {
    return false;
  }

  const maybeCurrent = mapOption(
    current.data.activeRound,
    ({ round }) => round.id,
  );
  const maybeNext = mapOption(next.data.activeRound, ({ round }) => round.id);
  const currentId = unwrapOptionOr(maybeCurrent, '');
  const nextId = unwrapOptionOr(maybeNext, '');
  return currentId !== nextId;
}

export function checkActive(state: State): State {
  if (state.gameState.kind !== 'loaded') {
    return state;
  }

  const { data: details } = state.gameState;
  const activeRound = mapOption(
    findActiveRound(details.game.rounds),
    (round) => ({ round, submission: empty() }),
  );
  return { ...state, gameState: loaded({ ...details, activeRound }) };
}
