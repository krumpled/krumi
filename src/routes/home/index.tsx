import React, { useState, useEffect } from 'react';
import { Redirect, Link } from 'react-router-dom';
import moment from 'moment';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import {
  mapOption,
  getAsyncRequestPromise as getPromise,
  flattenOptions,
  noop,
  unwrapOptionOr as unwrapOption,
  Option,
  none,
  AsyncRequest,
  loaded,
  notAsked,
  loading,
  some,
} from '@krumpled/krumi/std';
import { Session } from '@krumpled/krumi/session';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { LobbyInfo, leaving } from '@krumpled/krumi/routes/home/lobby-row';
import { loadLobbies, leaveLobby } from '@krumpled/krumi/routes/home/data-store';
import debug from 'debug';

const log = debug('krumi:route.home');

const EMPTY_LOBBY_TABLE_ROW = (
  <tr>
    <td className="py-2 px-3" colSpan={5}>
      No lobbies found, <Link to="/new-lobby">click here</Link> to create a new one.
    </td>
  </tr>
);

export type Props = {
  session: Session;
};

type State = {
  lobbies: AsyncRequest<Array<LobbyInfo>>;
  joinLobby: Option<{ value: string; sent: boolean }>;
};

function init(): State {
  return { lobbies: notAsked(), joinLobby: none() };
}

function renderLobbyActions(lobby: LobbyInfo, leave: (lobby: LobbyInfo) => void): React.FunctionComponentElement<{}> {
  switch (lobby.action.kind) {
    case 'not-asked':
      return (
        <div data-role="delete-lobby">
          <button
            data-role="leave btn"
            onClick={(): void => {
              leave(lobby);
            }}
          >
            Leave
          </button>
        </div>
      );
    default:
      return <div></div>;
  }
}

function renderLobby(lobby: LobbyInfo, leave: (lobby: LobbyInfo) => void): React.FunctionComponentElement<{}> {
  const actions = renderLobbyActions(lobby, leave);

  const link = (
    <Link to={`/lobbies/${lobby.id}`} className="block pr-2">
      {lobby.name}
    </Link>
  );

  const timestamp = (
    <span className="block">
      created <span>{moment(lobby.created).fromNow()}</span>
    </span>
  );

  return (
    <tr data-role="lobby" data-lobby-id={lobby.id} key={lobby.id}>
      <td className="py-2 pr-3">{link}</td>
      <td className="py-2 px-3">{timestamp}</td>
      <td className="py-2 px-3">{lobby.gameCount}</td>
      <td className="py-2 px-3">{lobby.memberCount}</td>
      <td className="py-2 px-3">{actions}</td>
    </tr>
  );
}

async function eff(state: State, update: (state: State) => void): Promise<State> {
  const { lobbies } = state;

  if (lobbies.kind === 'not-asked') {
    const attempt = loadLobbies();
    log('lobbies not yet requested, loading');
    update({ ...state, lobbies: loading(attempt) });
    const result = loaded(await attempt);
    const next = { ...state, lobbies: result };
    log('lobbies loaded');
    update(next);
    return next;
  }

  // If we're loaded, check to see if we're currently leaving any lobbies.
  if (lobbies.kind === 'loaded') {
    const { data: lobbyList } = lobbies;
    const promises = flattenOptions(lobbyList.map((lobby) => getPromise(lobby.action)));

    if (promises.length) {
      await Promise.all([promises]);
      update(init());
    }
  }

  return state;
}

function Home(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    const semo = { current: true };
    const innerUpdate = (state: State): void => {
      log('update received, should apply - "%s"', semo.current);
      return semo.current ? update(state) : noop();
    };
    eff(state, innerUpdate);

    return (): void => {
      log('cleaning up lobby effect, currently "%s"', state.lobbies.kind);
      return noop((semo.current = state.lobbies.kind === 'not-asked'));
    };
  });

  const { lobbies } = state;

  if (lobbies.kind === 'not-asked' || lobbies.kind === 'loading') {
    return (
      <section data-role="home" className="x-gutters y-content y-gutters">
        <Loading />
      </section>
    );
  } else if (lobbies.kind === 'failed') {
    return <ApplicationError errors={lobbies.errors} />;
  }

  const leave = (lobby: LobbyInfo): void => {
    log("leaving lobby '%s'", lobby.name);
    const promise = leaveLobby(lobby);
    const nextLobbies = lobbies.data.map((existing) => (existing.id === lobby.id ? leaving(lobby, promise) : existing));
    update({ ...state, lobbies: loaded(nextLobbies) });
  };

  const list = lobbies.data.length ? lobbies.data.map((lobby) => renderLobby(lobby, leave)) : EMPTY_LOBBY_TABLE_ROW;

  if (state.joinLobby.kind === 'some' && state.joinLobby.data.sent) {
    const targetId = state.joinLobby.data.value.trim();
    return <Redirect to={`/join-lobby/${targetId}`} />;
  }

  return <section data-role="home" className="x-gutters y-content y-gutters flex"></section>;
}

export default AuthenticatedRoute(Home);
