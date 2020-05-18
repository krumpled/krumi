import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import moment from 'moment';
import { fetch } from '@krumpled/krumi/krumnet';
import {
  Result,
  AsyncRequest,
  failed,
  loaded,
  notAsked,
  loading,
} from '@krumpled/krumi/std';
import debug from 'debug';

const log = debug('krumi:route.lobby');

type LobbyGame = {
  id: string;
  name: string;
  roundsRemaining: number;
  created: number;
};

type LobbyDetailResponse = {
  id: string;
  name: string;
  games: Array<LobbyGame>;
};

type State = {
  id: string;
  data: AsyncRequest<{ lobby: LobbyDetailResponse }>;
};

async function loadLobby(id: string): Promise<LobbyDetailResponse> {
  const detail = (await fetch(`/lobbies/${id}`)) as Result<LobbyDetailResponse>;

  if (detail.kind === 'err') {
    const [e] = detail.errors;
    return Promise.reject(e);
  }

  return detail.data;
}

function init(): State {
  const { id } = useParams();
  return { id, data: notAsked() };
}

function renderGame(
  game: LobbyGame,
  lobbyId: string,
): React.FunctionComponentElement<{}> {
  const created = moment(game.created);
  log('rendering game created on "%s"', created.fromNow());
  return (
    <li
      data-role="game"
      className="py-2 flex items-center"
      key={game.id}
      data-rounds-remaining={game.roundsRemaining}
    >
      <Link to={`/lobbies/${lobbyId}/games/${game.id}`} className="block pr-2">
        {game.name}
      </Link>
      <span className="block pr-2">
        created <span>{created.fromNow()}</span>
      </span>
      <span className="block">
        <span>{game.roundsRemaining}</span> rounds remaining
      </span>
    </li>
  );
}

function Lobby(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    if (state.data.kind !== 'not-asked') {
      return;
    }

    log('lobby hasnt  been requested yet, sending request');
    const promise = loadLobby(state.id).then((data) => ({ lobby: data }));

    promise
      .then((data) => update({ ...state, data: loaded(data) }))
      .catch((e) => update({ ...state, data: failed([e]) }));

    update({ ...state, data: loading(promise) });
  });

  switch (state.data.kind) {
    case 'loading':
    case 'not-asked':
      return <Loading />;
    case 'loaded': {
      const { lobby } = state.data.data;
      log('successfully loaded lobby - "%s"', lobby.id);
      const games = lobby.games.length ? (
        lobby.games.map((game) => renderGame(game, lobby.id))
      ) : (
        <li className="py-3">
          <Link to={`/lobbies/${state.id}/new-game`}>New Game</Link>
        </li>
      );
      return (
        <section className="y-content x-gutters y-gutters flex">
          <aside data-role="games" className="pr-4">
            <header className="block flex items-center pb-2 block mb-2">
              <h4 className="block pr-2">Games</h4>
              <Link to={`/lobbies/${state.id}/new-game`}>New</Link>
            </header>
            <ul>{games}</ul>
          </aside>
          <aside data-role="members" className="px-4">
            <h4 className="pb-2">Members</h4>
            <ul></ul>
          </aside>
        </section>
      );
    }
    case 'failed':
      return <ApplicationError errors={state.data.errors} />;
  }
}

export default AuthenticatedRoute(Lobby);
