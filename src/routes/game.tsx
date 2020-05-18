import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import {
  AsyncRequest,
  loaded,
  failed,
  loading,
  notAsked,
} from '@krumpled/krumi/std';
import ApplicationError from '@krumpled/krumi/components/application-error';
import Loading from '@krumpled/krumi/components/application-loading';
import debug from 'debug';

const log = debug('krumi:route.game');

export type Details = {
  lobby: { id: string };
  game: { id: string };
};

export type State = {
  lobbyId: string;
  gameId: string;
  details: AsyncRequest<Details>;
};

async function load(lobbyId: string, gameId: string): Promise<Details> {
  const lobby = { id: lobbyId };
  const game = { id: gameId };
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { lobby, game };
}

function init(): State {
  const { lobbyId, gameId } = useParams();
  return { lobbyId, gameId, details: notAsked() };
}

function Game(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    const { details } = state;

    switch (details.kind) {
      case 'not-asked': {
        log('fetching details');
        const promise = load(state.lobbyId, state.gameId);
        const details = loading(promise);
        promise
          .then((details) => update({ ...state, details: loaded(details) }))
          .catch((e) => update({ ...state, details: failed([e]) }));
        return update({ ...state, details });
      }
    }
  });

  switch (state.details.kind) {
    case 'not-asked':
    case 'loading':
      log('loading game %s', state.gameId);
      return (
        <section className="y-content y-gutters x-gutters">
          <Loading />
        </section>
      );
    case 'failed':
      return <ApplicationError errors={state.details.errors} />;
    case 'loaded': {
      const { lobby, game } = state.details.data;
      log('game "%s" loaded', game.id);
      return (
        <section className="y-content y-gutters x-gutters">
          <aside>
            <Link to={`/lobbies/${lobby.id}`}>Back to Lobby</Link>
          </aside>
          <main data-role="main-game-contents"></main>
        </section>
      );
    }
  }
}

export default AuthenticatedRoute(Game);
