import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { Session } from '@krumpled/krumi/session';
import {
  mapOption,
  mapOptionAsync,
  loaded,
  failed,
  loading,
  ready,
} from '@krumpled/krumi/std';
import ApplicationError from '@krumpled/krumi/components/application-error';
import Loading from '@krumpled/krumi/components/application-loading';
import debug from 'debug';
import {
  State,
  init,
  changedActiveRound,
  findActiveRound,
  ActiveRound,
  GameState,
} from '@krumpled/krumi/routes/game/state';
import {
  RoundSubmission,
  failed as failedSubmission,
  pending as pendingSubmission,
  empty as emptySubmission,
  done as finishedSubmission,
} from '@krumpled/krumi/routes/game/round-submission';
import {
  GameDetailRound,
  fetchRoundDetails,
  fetchGame,
  createEntry,
} from '@krumpled/krumi/routes/game/data-store';
import RoundDisplay from '@krumpled/krumi/routes/game/round-display';

const log = debug('krumi:route.game');

async function loadRoundDetails(
  roundDetails: GameDetailRound,
): Promise<ActiveRound> {
  log('fetching round details for round "%s"', roundDetails.id);
  const round = await fetchRoundDetails(roundDetails.id);

  if (round.kind === 'err') {
    const [e] = round.errors;
    return Promise.reject(e);
  }

  return { round: round.data, submission: emptySubmission() };
}

async function load(state: State): Promise<GameState> {
  const lobby = { id: state.lobbyId };

  const res = await fetchGame(state.gameId);

  if (res.kind === 'err') {
    const [e] = res.errors;
    return Promise.reject(e);
  }

  const { data: details } = res;

  log('loaded game "%s" (created %s)', details.id, details.created);

  const maybeActive = findActiveRound(details.rounds);
  const activeRoundDetails = await mapOptionAsync(
    maybeActive,
    loadRoundDetails,
  );
  const activeRound = mapOption(activeRoundDetails, (details) => {
    const entry = details.round.entries.find((e) => e.userId === state.userId);

    if (!entry) {
      return details;
    }

    return { ...details, submission: finishedSubmission(entry.entry) };
  });

  return { lobby, game: details, activeRound };
}

function roundIcon({
  completed,
  started,
}: GameDetailRound): React.FunctionComponentElement<{}> {
  if (completed) {
    return <Icon icon="circle" />;
  }

  if (started && started < new Date().getTime()) {
    return <Icon icon="dot-circle" />;
  }

  return <Icon icon="plus" className="opacity-0" />;
}

function renderRoundSummary(
  round: GameDetailRound,
): React.FunctionComponentElement<{}> {
  const icon = roundIcon(round);

  return (
    <li data-round-id={round.id} key={round.id} className="py-2 flex">
      <span className="block pr-2 mr-2">{icon}</span>
      <span className="block">
        Round <span>{round.position + 1}</span>
      </span>
    </li>
  );
}

async function p(
  state: State,
  update: (state: State) => void,
  cancellation: Promise<void>,
): Promise<void> {
  const preflight = await Promise.race([cancellation, ready('yes', 5000)]);

  if (preflight !== 'yes') {
    log('cancellation promise resolved before slight preflight, skipping');
    return;
  }

  debug('delayed, loading potentially new state');

  const attempt = load(state);
  const res = await Promise.race([cancellation, attempt]);

  if (!res) {
    log('cancellation promise resolved first, skipping poll');
    return;
  }

  const next = { ...state, gameState: loaded(res) };

  if (changedActiveRound(state, next)) {
    log('active round has changed, updating state');
    update(next);
  }

  log('successfully reloaded game, queing another attempt');
  p(state, update, cancellation);
}

function poll(state: State, update: (state: State) => void): () => void {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let stop = function (): void {};
  const cancellation = new Promise<void>((resolve) => (stop = resolve));
  p(state, update, cancellation).catch(stop);
  return stop;
}

type Props = {
  session: Session;
};

function Game(props: Props): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init({ session: props.session }));

  useEffect(() => {
    const { gameState: details } = state;

    switch (details.kind) {
      case 'loaded': {
        log('finished loading game, starting poll interval');
        return poll(state, update);
      }
      case 'not-asked': {
        log('fetching details');
        const promise = load(state);
        const gameState = loading(promise);

        promise
          .then((details) => update({ ...state, gameState: loaded(details) }))
          .catch((e) => update({ ...state, gameState: failed([e]) }));

        return update({ ...state, gameState });
      }
    }
  });

  switch (state.gameState.kind) {
    case 'not-asked':
    case 'loading':
      log('loading game %s', state.gameId);
      return (
        <section className="y-content y-gutters x-gutters">
          <Loading />
        </section>
      );
    case 'failed':
      return <ApplicationError errors={state.gameState.errors} />;
    case 'loaded': {
      const { data: gameState } = state.gameState;
      const { lobby, game } = gameState;

      log('game "%s" loaded', game.id);
      const roundSummaries = game.rounds.map(renderRoundSummary);

      const replaceSubmission = (submission: RoundSubmission): void => {
        const activeRound = mapOption(gameState.activeRound, (round) => ({
          ...round,
          submission,
        }));
        const newGameState = loaded({ ...gameState, activeRound });

        update({
          ...state,
          gameState: newGameState,
        });
      };

      const updateSubmission = (value: string): void => {
        log('updating submission "%s"', value);
        const submission = emptySubmission(value);
        replaceSubmission(submission);
      };

      const submitSubmission = (roundId: string, value: string): void => {
        log('sending submission "%s"', value);
        const promise = createEntry(roundId, value);
        const submission = pendingSubmission(promise);

        promise
          .then((result) => {
            const finished = finishedSubmission(result.entry);
            replaceSubmission(finished);
          })
          .catch((e) => {
            const failed = failedSubmission(e);
            replaceSubmission(failed);
          });

        replaceSubmission(submission);
      };

      return (
        <section className="y-content y-gutters x-gutters flex">
          <aside className="pr-5">
            <header className="pb-2 mb-2 border-b border-black border-solid">
              <Link to={`/lobbies/${lobby.id}`} className="block">
                Back to Lobby
              </Link>
            </header>
            <h2 className="pb-2 block">Rounds</h2>
            <ul className="block">{roundSummaries}</ul>
          </aside>
          <main data-role="main-game-contents" className="pl-3 block">
            <RoundDisplay
              round={gameState.activeRound}
              updateSubmission={updateSubmission}
              submitSubmission={submitSubmission}
            />
          </main>
        </section>
      );
    }
  }
}

export default AuthenticatedRoute(Game);
