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
import { State, init, load, changedActiveRound, GameState } from '@krumpled/krumi/routes/game/state';
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

type ActiveGameProps = {
  gameState: GameState;
  update: (state: GameState) => void;
};

function ActiveGame(props: ActiveGameProps): React.FunctionComponentElement<{}> {
  const replaceSubmission = (submission: RoundSubmission): void => {
    const { cursor: previous } = props.gameState;
    const cursor = mapOption(previous, (round) => ({
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
    const vote = loading(promise);
    const cursor = mapOption(previous, (r) => ({ ...r, vote }));
    props.update({ ...props.gameState, cursor });

    promise
      .then(loaded)
      .catch((e) => failed<{ id: string }>(e))
      .then((vote) => mapOption(previous, (r) => ({ ...r, vote })))
      .then((cursor) => {
        log('vote complete, updating game state');
        props.update({ ...props.gameState, cursor });
      });

    log('voting for entry "%s" for round "%s"', roundId, entryId);
  };

  return (
    <RoundDisplay
      round={props.gameState.cursor}
      updateSubmission={updateSubmission}
      submitSubmission={submitSubmission}
      voteForEntry={voteForEntry}
    />
  );
}

function EndedGame(props: { game: GameState['game'] }): React.FunctionComponentElement<{}> {
  const endedAgo = props.game.ended ? moment(props.game.ended).fromNow() : '';
  const placements = props.game.placements.map((place) => {
    return (
      <tr data-role="placement" data-placement-id={place.id} key={place.id}>
        <td>{place.place}</td>
        <td>{place.userName}</td>
      </tr>
    );
  });

  return (
    <article data-role="game-results">
      <h2>Ended {endedAgo}</h2>
      <table>
        <thead>
          <tr>
            <th>Place</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>{placements}</tbody>
      </table>
    </article>
  );
}

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
      const updateGameState = (newState: GameState): void => update({ ...state, gameState: loaded(newState) });

      const content =
        game.ended && game.placements && game.placements.length
          ? EndedGame({ game })
          : ActiveGame({ update: updateGameState, gameState });

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
            {content}
          </main>
        </section>
      );
    }
  }
}

export default AuthenticatedRoute(Game);
