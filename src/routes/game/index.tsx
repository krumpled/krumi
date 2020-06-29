import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { Session } from '@krumpled/krumi/session';
import * as std from '@krumpled/krumi/std';
import ApplicationError from '@krumpled/krumi/components/application-error';
import Loading from '@krumpled/krumi/components/application-loading';
import debug from 'debug';
import { State, init, load, changedActiveRound, GameState } from '@krumpled/krumi/routes/game/state';
import {
  RoundSubmission,
  failed as failedSubmission,
  pending as pendingSubmission,
  empty as emptySubmission,
  done as finishedSubmission,
} from '@krumpled/krumi/routes/game/round-submission';
import { createEntry, createVote } from '@krumpled/krumi/routes/game/data-store';
import RoundDisplay from '@krumpled/krumi/routes/game/round-display';
import shortenName from '@krumpled/krumi/shorten-name';

const log = debug('krumi:route.game');
const POLL_DELAY = 2000;

async function p(state: State, update: (state: State) => void, cancellation: Promise<void>): Promise<void> {
  const preflight = await Promise.race([cancellation, std.ready('yes', POLL_DELAY)]);

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

  const next = { ...state, gameState: std.loaded(res) };

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

type ActiveGameProps = {
  gameState: GameState;
  update: (state: GameState) => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
function ActiveGame(props: ActiveGameProps): React.FunctionComponentElement<{}> {
  const replaceSubmission = (submission: RoundSubmission): void => {
    const { cursor: previous } = props.gameState;
    const cursor = std.mapOption(previous, (round) => ({
      ...round,
      submission,
    }));

    props.update({ ...props.gameState, cursor });
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
    const { cursor: previous } = props.gameState;
    const promise = createVote(roundId, entryId);
    const vote = std.loading(promise);
    const cursor = std.mapOption(previous, (previousCursor) => ({ ...previousCursor, vote }));
    props.update({ ...props.gameState, cursor });

    promise
      .then(std.loaded)
      .catch((e) => std.failed<{ id: string }>([e]))
      .then((vote) => std.mapOption(previous, (r) => ({ ...r, vote })))
      .then((cursor) => {
        log('vote complete, updating game state');
        props.update({ ...props.gameState, cursor });
      });

    log('voting for entry "%s" for round "%s"', roundId, entryId);
  };

  const clearWarning = (): void => {
    const { cursor: previous } = props.gameState;
    const vote = std.notAsked<{ id: string }>();
    const cursor = std.mapOption(previous, (previousCursor) => ({ ...previousCursor, vote }));
    props.update({ ...props.gameState, cursor });
  };

  return (
    <RoundDisplay
      round={props.gameState.cursor}
      updateSubmission={updateSubmission}
      submitSubmission={submitSubmission}
      clearWarning={clearWarning}
      voteForEntry={voteForEntry}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function EndedGame(props: { game: GameState['game'] }): React.FunctionComponentElement<{}> {
  const placements = props.game.placements.map((place) => {
    return (
      <tr data-role="placement" data-placement-id={place.id} key={place.id}>
        <td className="text-left">{place.place}</td>
        <td className="w-full text-left">{place.userName}</td>
      </tr>
    );
  });

  return (
    <article data-role="game-results">
      <header className="py-3 mb-3">
        <h2 className="text-center bold">Game Over!</h2>
      </header>
      <table>
        <thead>
          <tr>
            <th className="text-left">Place</th>
            <th className="text-left w-full">Name</th>
          </tr>
        </thead>
        <tbody>{placements}</tbody>
      </table>
    </article>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function Game(props: Props): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init({ session: props.session }));

  useEffect(() => {
    const { gameState: details } = state;

    switch (details.kind) {
      case 'loaded': {
        const { id: gameId, ended } = details.data.game;

        if (ended) {
          log('game "%s" appears to be ended, skipping update polling', gameId);
          return;
        }

        log('game "%s" in progress, starting update polling', gameId);
        return poll(state, update);
      }
      case 'loading': {
        const { promise } = details;

        promise
          .then((details) => update({ ...state, gameState: std.loaded(details) }))
          .catch((e) => update({ ...state, gameState: std.failed([e]) }));

        break;
      }
      case 'not-asked': {
        const promise = load(state);
        const gameState = std.loading(promise);

        return update({ ...state, gameState });
      }
    }
  });

  if (state.gameState.kind === 'not-asked' || state.gameState.kind === 'loading') {
    return (
      <section className="y-content y-gutters x-gutters">
        <Loading />
      </section>
    );
  } else if (state.gameState.kind === 'failed') {
    return <ApplicationError errors={state.gameState.errors} />;
  }

  const { data: gameState } = state.gameState;
  const { lobby, game } = gameState;

  log('game "%s" loaded', game.id);
  const updateGameState = (newState: GameState): void => update({ ...state, gameState: std.loaded(newState) });

  const content =
    game.ended && game.placements && game.placements.length
      ? EndedGame({ game })
      : ActiveGame({ update: updateGameState, gameState });

  return (
    <section className="y-content y-gutters x-gutters">
      <header className="mb-3 border-b border-gray-400 border-solid pb-3">
        <h1>
          <Link to={`/lobbies/${lobby.id}`}>{shortenName(lobby.name)}</Link>
          <span className="text-gray-400">
            &nbsp;
            <Icon icon="chevron-right" />
            &nbsp;
          </span>
          <b>{shortenName(game.name)}</b>
        </h1>
      </header>
      <section className="">{content}</section>
    </section>
  );
}

export default AuthenticatedRoute(Game);
