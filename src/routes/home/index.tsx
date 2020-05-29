import React, { useState, useEffect } from 'react';
import { Redirect, Link } from 'react-router-dom';
import moment from 'moment';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import {
  mapOption,
  unwrapOptionOr as unwrapOption,
  Option,
  none,
  AsyncRequest,
  loaded,
  failed,
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

function Home(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    const { lobbies } = state;

    if (lobbies.kind === 'not-asked') {
      const promise = loadLobbies();
      const lobbies = loading(promise);

      promise
        .then((data) => update({ ...state, lobbies: loaded(data) }))
        .catch((e) => update({ ...state, lobbies: failed([e]) }));

      update({ ...state, lobbies });
      return;
    }

    if (lobbies.kind === 'loaded') {
      const promises = lobbies.data.reduce((acc, { action }) => {
        return action.kind === 'loading' ? [...acc, action.promise] : acc;
      }, new Array<Promise<string>>());

      if (promises.length) {
        Promise.all(promises)
          .then(() => update(init()))
          .catch((errors) => update({ ...state, lobbies: failed(errors) }));
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
      const leave = (lobby: LobbyInfo): void => {
        log("leaving lobby '%s'", lobby.name);
        const promise = leaveLobby(lobby);
        const nextLobbies = lobbies.data.map((existing) =>
          existing.id === lobby.id ? leaving(lobby, promise) : existing,
        );
        update({ ...state, lobbies: loaded(nextLobbies) });
      };

      const list = lobbies.data.length ? lobbies.data.map((lobby) => renderLobby(lobby, leave)) : EMPTY_LOBBY_TABLE_ROW;

      if (state.joinLobby.kind === 'some' && state.joinLobby.data.sent) {
        const targetId = state.joinLobby.data.value.trim();
        return <Redirect to={`/join-lobby/${targetId}`} />;
      }

      return (
        <section data-role="home" className="x-gutters y-content y-gutters flex">
          <aside data-role="lobby-list" className="block pr-4">
            <header className="flex pb-2 mb-2">
              <h2 className="block pr-2">Lobbies</h2>
              <Link to="/new-lobby">New</Link>
            </header>
            <table>
              <thead>
                <tr>
                  <th className="pr-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Games</th>
                  <th className="px-3 py-2 text-left">Members</th>
                  <th className="px-3 py-2 text-left"></th>
                </tr>
              </thead>
              <tbody>{list}</tbody>
            </table>
          </aside>
          <aside className="pl-4 block">
            <h2 className="block pb-2 mb-2">Join</h2>
            <div className="block flex items-center">
              <input
                type="text"
                className="input-white"
                value={unwrapOption(state.joinLobby, { value: '', sent: false }).value}
                onChange={(e): void => {
                  update({
                    ...state,
                    joinLobby: some({
                      value: (e.target as HTMLInputElement).value,
                      sent: false,
                    }),
                  });
                }}
              />
              <button
                className="btn ml-2"
                onClick={(): void => {
                  update({
                    ...state,
                    joinLobby: mapOption(state.joinLobby, ({ value }) => ({
                      value,
                      sent: true,
                    })),
                  });
                }}
              >
                go
              </button>
            </div>
          </aside>
        </section>
      );
    }
    case 'failed':
      return <ApplicationError errors={lobbies.errors} />;
  }
}

export default AuthenticatedRoute(Home);
