import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { Session } from '@krumpled/krumi/session';
import moment from 'moment';
import { mapOption, loaded, failed, loading, ready } from '@krumpled/krumi/std';
import ApplicationError from '@krumpled/krumi/components/application-error';
import Loading from '@krumpled/krumi/components/application-loading';
import debug from 'debug';
import { State, init, load, changedActiveRound } from '@krumpled/krumi/routes/game/state';
import {
  RoundSubmission,
  failed as failedSubmission,
  pending as pendingSubmission,
  empty as emptySubmission,
  done as finishedSubmission,
} from '@krumpled/krumi/routes/game/round-submission';
import { GameDetailRound, createEntry, createVote } from '@krumpled/krumi/routes/game/data-store';
import RoundDisplay from '@krumpled/krumi/routes/game/round-display';

const log = debug('krumi:route.game');

function roundIcon({ fulfilled: completed, started }: GameDetailRound): React.FunctionComponentElement<{}> {
  if (completed) {
    return <Icon icon="circle" />;
  }

  if (started && started < new Date().getTime()) {
    return <Icon icon="dot-circle" />;
  }

  return <Icon icon="plus" className="opacity-0" />;
}

function renderRoundSummary(round: GameDetailRound): React.FunctionComponentElement<{}> {
  const icon = roundIcon(round);

  return (
    <tr data-round-id={round.id} key={round.id}>
      <td>
        <span className="block pr-2 mr-2">{icon}</span>
      </td>
      <td>
        <span className="block">
          Round <span>{round.position + 1}</span>
        </span>
      </td>
    </tr>
  );
}

async function p(state: State, update: (state: State) => void, cancellation: Promise<void>): Promise<void> {
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
        const { cursor: previous } = gameState;
        const cursor = mapOption(previous, (round) => ({
          ...round,
          submission,
        }));
        const newGameState = loaded({ ...gameState, cursor });

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
          .then((result) => finishedSubmission(result.entry))
          .catch((e) => failedSubmission(e))
          .then((submission) => replaceSubmission(submission));

        replaceSubmission(submission);
      };

      const voteForEntry = (roundId: string, entryId: string): void => {
        const { cursor: previous } = gameState;
        const promise = createVote(roundId, entryId);
        const vote = loading(promise);
        const cursor = mapOption(previous, (r) => ({ ...r, vote }));
        const newGameState = loaded({ ...gameState, cursor });
        update({ ...state, gameState: newGameState });

        promise
          .then(loaded)
          .catch((e) => failed<{ id: string }>(e))
          .then((vote) => mapOption(previous, (r) => ({ ...r, vote })))
          .then((cursor) => {
            const newGameState = loaded({ ...gameState, cursor });
            log('vote complete, updating game state');
            update({ ...state, gameState: newGameState });
          });

        log('voting for entry "%s" for round "%s"', roundId, entryId);
      };

      return (
        <section className="y-content y-gutters x-gutters flex">
          <aside className="pr-5">
            <header className="pb-2 mb-2">
              <h2>
                <b>{gameState.game.name}</b> started <span>{moment(gameState.game.created).fromNow()}</span>
              </h2>
            </header>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Round No.</th>
                </tr>
              </thead>
              <tbody>{roundSummaries}</tbody>
            </table>
          </aside>
          <main data-role="main-game-contents" className="pl-3 block">
            <header className="pb-2 mb-2">
              <Link to={`/lobbies/${lobby.id}`} className="block">
                Back to Lobby
              </Link>
            </header>
            <RoundDisplay
              round={gameState.cursor}
              updateSubmission={updateSubmission}
              submitSubmission={submitSubmission}
              voteForEntry={voteForEntry}
            />
          </main>
        </section>
      );
    }
  }
}

export default AuthenticatedRoute(Game);
