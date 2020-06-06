import React, { useState, useEffect } from 'react';
import { Redirect, Link } from 'react-router-dom';
import moment from 'moment';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import * as std from '@krumpled/krumi/std';
import { Session } from '@krumpled/krumi/session';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import Icon from '@krumpled/krumi/components/icon';
import { LobbyInfo, leaving } from '@krumpled/krumi/routes/home/lobby-row';
import { loadLobbies, leaveLobby } from '@krumpled/krumi/routes/home/data-store';
import debug from '@krumpled/krumi/logging';

const log = debug('krumi:route.home');

const EMPTY_LOBBY_TABLE_ROW = (
  <tr>
    <td colSpan={5}>
      <p>You are not a member of any lobbies</p>
    </td>
  </tr>
);

export type Props = {
  session: Session;
};

type State = {
  lobbies: std.AsyncRequest<Array<LobbyInfo>>;
  joinLobby: std.Option<{ value: string; sent: boolean }>;
};

function init(): State {
  return { lobbies: std.notAsked(), joinLobby: std.none() };
}

function renderLobbyActions(lobby: LobbyInfo, leave: (lobby: LobbyInfo) => void): React.FunctionComponentElement<{}> {
  const { action } = lobby;

  return (
    <div className="inline-block">
      <button
        data-role="leave"
        className="btn"
        disabled={action.kind !== 'not-asked'}
        onClick={(): void => leave(lobby)}
      >
        <Icon icon="times" />
      </button>
    </div>
  );
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
      <td className="table-cell w-full">{link}</td>
      <td className="hidden md:table-cell">{timestamp}</td>
      <td className="hidden md:table-cell">{lobby.gameCount}</td>
      <td className="hidden md:table-cell">{lobby.memberCount}</td>
      <td className="table-cell">{actions}</td>
    </tr>
  );
}

async function eff(state: State, update: (state: State) => void): Promise<State> {
  const { lobbies } = state;

  if (lobbies.kind === 'not-asked') {
    const attempt = loadLobbies();
    update({ ...state, lobbies: std.loading(attempt) });
    const result = std.loaded(await attempt);
    const next = { ...state, lobbies: result };
    update(next);
    return next;
  }

  // If we're loaded, check to see if we're currently leaving any lobbies.
  if (lobbies.kind === 'loaded') {
    const { data: lobbyList } = lobbies;
    const promises = std.flattenOptions(lobbyList.map((lobby) => std.getAsyncRequestPromise(lobby.action)));

    if (promises.length) {
      log('found "%s" pending lobbies, waiting and reloading page', promises.length);
      await Promise.all(promises);
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
      return semo.current ? update(state) : std.noop();
    };

    eff(state, innerUpdate);

    return (): void => {
      return std.noop((semo.current = state.lobbies.kind === 'not-asked'));
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

  if (state.joinLobby.kind === 'some' && state.joinLobby.data.sent) {
    const targetId = state.joinLobby.data.value.trim();
    return <Redirect to={`/join-lobby/${targetId}`} />;
  }

  const leave = (lobby: LobbyInfo): void => {
    log("leaving lobby '%s'", lobby.name);
    const promise = leaveLobby(lobby);
    const nextLobbies = lobbies.data.map((existing) => (existing.id === lobby.id ? leaving(lobby, promise) : existing));
    update({ ...state, lobbies: std.loaded(nextLobbies) });
  };

  const updateLobbyTarget = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    const joinLobby = std.some({ value, sent: false });
    update({ ...state, joinLobby });
  };

  const gotoLobby = (): void => {
    const { joinLobby } = state;

    if (joinLobby.kind === 'none') {
      return;
    }

    log("joining lobby '%s'", joinLobby.data.value);
    const next = std.mapOption(joinLobby, (contents) => ({ ...contents, sent: true }));
    update({ ...state, joinLobby: next });
  };

  const lobbyId = std.unwrapOptionOr(
    std.mapOption(state.joinLobby, ({ value }) => value),
    '',
  );

  const lobbyRows = lobbies.data.map((lobb) => renderLobby(lobb, leave));

  return (
    <section data-role="home" className="x-gutters y-content y-gutters">
      <article className="mb-4 flex text-center w-full flex" data-role="join-lobby">
        <input
          type="text"
          placeholder="Join Lobby"
          className="white-input"
          onChange={updateLobbyTarget}
          value={lobbyId}
        />
        <button className="btn block ml-3" onClick={gotoLobby} disabled={!lobbyId}>
          <Icon icon="hat-cowboy" />
        </button>
        <aside className="ml-8 pl-8 block border-l border-light">
          <Link to="/new-lobby" className="btn">
            New
          </Link>
        </aside>
      </article>
      <article className="w-full block">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Lobby</th>
              <th className="text-left hidden md:table-cell">Joined</th>
              <th className="text-left hidden md:table-cell">Games</th>
              <th className="text-left hidden md:table-cell">Members</th>
              <th className="text-left"></th>
            </tr>
          </thead>
          <tbody>{lobbyRows.length ? lobbyRows : EMPTY_LOBBY_TABLE_ROW}</tbody>
        </table>
      </article>
    </section>
  );
}

export default AuthenticatedRoute(Home);
