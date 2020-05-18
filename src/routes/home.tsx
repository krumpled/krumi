import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import {
  Result,
  AsyncRequest,
  camelizeKeys,
  loaded,
  failed,
  notAsked,
  loading,
} from '@krumpled/krumi/std';
import { Session } from '@krumpled/krumi/session';
import { fetch } from '@krumpled/krumi/krumnet';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import debug from 'debug';

const log = debug('krumi:route.home');

export type Props = {
  session: Session;
};

export type LobbyInfo = {
  id: string;
  name: string;
  created: number;
};

type State = {
  lobbies: AsyncRequest<Array<LobbyInfo>>;
};

type LobbyResponse = {
  lobbies: Array<LobbyInfo>;
};

async function loadLobbies(): Promise<Array<LobbyInfo>> {
  const data = camelizeKeys(await fetch('/lobbies')) as Result<LobbyResponse>;

  if (data.kind === 'err') {
    return Promise.reject(data.errors);
  }

  log('lobby data fetched from api - %o', data);

  const { lobbies } = data.data;
  return lobbies.map((lobby) => lobby);
}

function init(): State {
  return { lobbies: notAsked() };
}

function renderLobby(lobby: LobbyInfo): React.FunctionComponentElement<{}> {
  return (
    <li
      data-role="lobby"
      data-lobby-id={lobby.id}
      key={lobby.id}
      className="flex py-2 items-center"
    >
      <Link to={`/lobbies/${lobby.id}`} className="block pr-2">
        {lobby.name}
      </Link>
      <span className="block">
        created <span>{moment(lobby.created).fromNow()}</span>
      </span>
    </li>
  );
}

function Home(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    const { lobbies } = state;

    switch (lobbies.kind) {
      case 'not-asked': {
        const promise = loadLobbies();
        const lobbies = loading(promise);

        promise
          .then((data) => update({ ...state, lobbies: loaded(data) }))
          .catch((e) => update({ ...state, lobbies: failed([e]) }));

        update({ ...state, lobbies });
        break;
      }
    }

    log('home effect, state - %o', state);
  });

  const { lobbies } = state;
  log('user logged in, rendering content');

  switch (lobbies.kind) {
    case 'not-asked':
    case 'loading':
      return (
        <section data-role="home" className="x-gutters y-content y-gutters">
          <Loading />
        </section>
      );
    case 'loaded': {
      const list = lobbies.data.length ? (
        lobbies.data.map(renderLobby)
      ) : (
        <li className="py-2">
          No lobbies found, <Link to="/new-lobby">click here</Link> to create a
          new one.
        </li>
      );
      log('finished loadding lobbies %o', lobbies.data);
      return (
        <section
          data-role="home"
          className="x-gutters y-content y-gutters flex"
        >
          <aside data-role="lobby-list block pr-4">
            <header className="flex pb-2 mb-2">
              <h2 className="block pr-2">Lobbies</h2>
              <Link to="/new-lobby">New</Link>
            </header>
            <ul>{list}</ul>
          </aside>
        </section>
      );
    }
    case 'failed':
      return <ApplicationError errors={lobbies.errors} />;
  }
}

export default AuthenticatedRoute(Home);
