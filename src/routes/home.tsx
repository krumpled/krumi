import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
};

type State = {
  lobbies: AsyncRequest<Array<LobbyInfo>>;
};

type LobbyResponse = {
  lobbies: Array<{ id: string; name: string }>;
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
    <div data-role="lobby" data-lobby-id={lobby.id} key={lobby.id}>
      <Link to={`/lobbies/${lobby.id}`}>{lobby.name}</Link>
    </div>
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
      const list = lobbies.data.map(renderLobby);
      log('finished loadding lobbies %o', lobbies.data);
      return (
        <section data-role="home" className="x-gutters y-content y-gutters">
          <aside data-role="lobby-list">{list}</aside>
        </section>
      );
    }
    case 'failed':
      return <ApplicationError errors={lobbies.errors} />;
  }
}

export default AuthenticatedRoute(Home);
