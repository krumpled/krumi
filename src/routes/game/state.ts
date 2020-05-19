import {
  unwrapOptionOr,
  mapOption,
  fromNullable,
  notAsked,
  Option,
  AsyncRequest,
} from '@krumpled/krumi/std';
import { useParams } from 'react-router-dom';
import { RoundSubmission } from '@krumpled/krumi/routes/game/round-submission';
import {
  GameDetailResponse,
  GameDetailRound,
  RoundDetailResponse,
} from '@krumpled/krumi/routes/game/data-store';
import { Session } from '@krumpled/krumi/session';

export type ActiveRound = {
  round: RoundDetailResponse;
  submission: RoundSubmission;
};

export type GameState = {
  lobby: { id: string };
  game: GameDetailResponse;
  activeRound: Option<ActiveRound>;
};

export type State = {
  userId: string;
  lobbyId: string;
  gameId: string;
  gameState: AsyncRequest<GameState>;
};

export function init({ session }: { session: Session }): State {
  const { lobbyId, gameId } = useParams();
  const maybeId = mapOption(session.user, (user) => user.id);
  const userId = unwrapOptionOr(maybeId, '');
  return { lobbyId, gameId, gameState: notAsked(), userId };
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
