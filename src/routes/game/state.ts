import {
  none,
  some,
  loaded,
  orOption,
  mapOptionAsync,
  unwrapOptionOr,
  mapOption,
  fromNullable,
  notAsked,
  Option,
  AsyncRequest,
} from '@krumpled/krumi/std';
import { useParams } from 'react-router-dom';
import {
  RoundSubmission,
  empty as emptySubmission,
  done as finishedSubmission,
} from '@krumpled/krumi/routes/game/round-submission';
import {
  GameDetailResponse,
  LobbyDetailResponse,
  GameDetailRound,
  RoundDetailResponse,
  fetchRoundDetails,
  fetchGame,
  fetchLobby,
} from '@krumpled/krumi/routes/game/data-store';
import { Session } from '@krumpled/krumi/session';
import debug from 'debug';

const log = debug('krumi:routes.game.state');

export type VotingRound = {
  kind: 'voting-round';
  round: RoundDetailResponse;
  options: Array<{ id: string; value: string }>;
  vote: AsyncRequest<{ id: string }>;
};

export type ActiveRound = {
  kind: 'active-round';
  round: RoundDetailResponse;
  submission: RoundSubmission;
};

type Round = ActiveRound | VotingRound;

export type RoundCursor = Option<Round>;

export type GameState = {
  lobby: LobbyDetailResponse;
  game: GameDetailResponse;
  cursor: RoundCursor;
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

function isActive({ fulfilled: completed, started }: GameDetailRound): boolean {
  const now = new Date().getTime();

  if (!started || completed) {
    return false;
  }

  return started < now;
}

function findActiveRound(rounds: Array<GameDetailRound>): Option<GameDetailRound> {
  return fromNullable(rounds.find(isActive));
}

function findVotingRound(rounds: Array<GameDetailRound>): Option<GameDetailRound> {
  const [match] = rounds.reduce((acc, round) => {
    if (!round.fulfilled) {
      return [none<GameDetailRound>()];
    }

    if (!round.fulfilled || round.completed) {
      return acc;
    }

    return !acc.length
      ? [some(round)]
      : acc.map((opt) => mapOption(opt, (other) => (other.position < round.position ? other : round)));
  }, new Array<Option<GameDetailRound>>());
  return match || none();
}

export function changedActiveRound({ gameState: current }: State, { gameState: next }: State): boolean {
  if (current.kind !== 'loaded' || next.kind !== 'loaded') {
    return false;
  }

  const maybeCurrent = mapOption(current.data.cursor, ({ round }) => round.id);
  const maybeNext = mapOption(next.data.cursor, ({ round }) => round.id);
  const currentId = unwrapOptionOr(maybeCurrent, '');
  const nextId = unwrapOptionOr(maybeNext, '');
  return currentId !== nextId;
}

async function loadVotingRound(roundDetails: GameDetailRound, userId: string): Promise<Round> {
  log('fetching round details for voting round "%s"', roundDetails.id);
  const round = await fetchRoundDetails(roundDetails.id);

  if (round.kind === 'err') {
    const [e] = round.errors;
    return Promise.reject(e);
  }

  const options = round.data.entries.map(({ id, entry: value }) => ({ id, value }));
  const vote = round.data.votes.find((vote) => vote.userId === userId);

  return {
    kind: 'voting-round',
    round: round.data,
    options,
    vote: vote ? loaded(vote) : notAsked(),
  };
}

async function loadRoundDetails(roundDetails: GameDetailRound, userId: string): Promise<Round> {
  log('fetching round details for active round "%s"', roundDetails.id);
  const round = await fetchRoundDetails(roundDetails.id);

  if (round.kind === 'err') {
    const [e] = round.errors;
    return Promise.reject(e);
  }

  const entry = round.data.entries.find((e) => e.userId === userId);
  const submission = entry && entry.entry ? finishedSubmission(entry.entry) : emptySubmission();

  return {
    submission,
    round: round.data,
    kind: 'active-round',
  };
}

export async function load(state: State): Promise<GameState> {
  const [res, lobby] = await Promise.all([fetchGame(state.gameId), fetchLobby(state.lobbyId)]);

  if (lobby.kind === 'err') {
    const [e] = lobby.errors;
    return Promise.reject(e);
  }

  if (res.kind === 'err') {
    const [e] = res.errors;
    return Promise.reject(e);
  }

  const { data: details } = res;

  log('loaded game "%s" (created %s)', details.id, details.created);

  const maybeActive = findActiveRound(details.rounds);
  const activeRound = await mapOptionAsync(maybeActive, (details) => loadRoundDetails(details, state.userId));
  const maybeVoting = findVotingRound(details.rounds);
  const votingRound = await mapOptionAsync(maybeVoting, (votingRound) => loadVotingRound(votingRound, state.userId));

  return { lobby: lobby.data, game: details, cursor: orOption(activeRound, votingRound) };
}
