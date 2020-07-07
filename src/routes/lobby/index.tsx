import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import Loading from '@krumpled/krumi/components/application-loading';
import Icon from '@krumpled/krumi/components/icon';
import ApplicationError from '@krumpled/krumi/components/application-error';
import moment from 'moment';
import { fetch } from '@krumpled/krumi/krumnet';
import * as std from '@krumpled/krumi/std';
import shortenName from '@krumpled/krumi/shorten-name';
import debug from 'debug';

const log = debug('krumi:route.lobby');

const EMPTY_GAMES_TABLE_ROW = (
  <tr key="--empty-game">
    <td colSpan={3}>No Games</td>
  </tr>
);

type LobbyGame = {
  id: string;
  name: string;
  roundsRemaining: number;
  created: number;
};

type LobbyMember = {
  leftAt: number | null;
  joinedAt: number | null;
  memberId: string;
  userId: string;
  name: string;
};

type LobbyDetailResponse = {
  id: string;
  name: string;
  games: Array<LobbyGame>;
  members: Array<LobbyMember>;
};

type State = {
  id: string;
  data: std.AsyncRequest<{ lobby: LobbyDetailResponse }>;
};

async function loadLobby(id: string): Promise<LobbyDetailResponse> {
  const detail = (await fetch(`/lobbies`, { ids: [id] })) as std.Result<LobbyDetailResponse>;

  if (detail.kind === 'err') {
    const [e] = detail.errors;
    return Promise.reject(e);
  }

  return detail.data;
}

function init(): State {
  const { id } = useParams();
  return { id, data: std.notAsked() };
}

function renderGame(game: LobbyGame, lobbyId: string): React.FunctionComponentElement<unknown> {
  const created = moment(game.created);
  log('rendering game created on "%s"', created.fromNow());
  return (
    <tr data-role="game" className="text-left" key={game.id} data-rounds-remaining={game.roundsRemaining}>
      <td>
        <Link to={`/lobbies/${lobbyId}/games/${game.id}`} className="block pr-2">
          {shortenName(game.name)}
        </Link>
      </td>
      <td>
        <span>{created.fromNow()}</span>
      </td>
      <td className="hidden md:table-cell">
        <span>{game.roundsRemaining}</span>
      </td>
    </tr>
  );
}

function renderMember(member: LobbyMember): React.FunctionComponentElement<unknown> {
  const joinedAt = member.joinedAt ? moment(member.joinedAt).fromNow() : '';
  return (
    <tr data-member-user-id={member.userId} key={member.memberId} data-member-membership-id={member.memberId}>
      <td className="text-left w-full">{member.name}</td>
      <td className="text-left">{joinedAt}</td>
    </tr>
  );
}

function toggleDetails(viewing: string): [string, React.FunctionComponentElement<unknown>] {
  const viewingUsers = viewing === 'users';
  const mode = viewingUsers ? 'games' : 'users';
  const destination = `?mode=${mode}`;
  const icon = viewingUsers ? <Icon icon="gamepad" /> : <Icon icon="users" />;
  log('toggle destination - "%s" (currently "%s")', destination, viewing);
  return [destination, icon];
}

function Lobby(): React.FunctionComponentElement<unknown> {
  const { search } = useLocation();
  const mode = std.findQueryValue('mode', search || '');
  const viewing = std.unwrapOptionOr(
    std.mapOption(mode, ([m]) => (m === 'users' ? 'users' : 'games')),
    'games',
  );
  const [state, update] = useState(init());

  useEffect(() => {
    if (state.data.kind === 'not-asked') {
      const promise = loadLobby(state.id).then((data) => ({ lobby: data }));
      log('lobby request sent');
      update({ ...state, data: std.loading(promise) });
      return;
    }

    if (state.data.kind === 'loading') {
      const { promise } = state.data;
      log('lobby request pending, adding callbacks');

      promise
        .then((data) => update({ ...state, data: std.loaded(data) }))
        .catch((e) => update({ ...state, data: std.failed([e]) }));
    }
  });

  if (state.data.kind === 'loading' || state.data.kind === 'not-asked') {
    return <Loading />;
  } else if (state.data.kind === 'failed') {
    return <ApplicationError errors={state.data.errors} />;
  }

  const { lobby } = state.data.data;
  log('successfully loaded lobby - "%s" (viewing "%s")', lobby.id, viewing);

  const gameRows = lobby.games.map((game) => renderGame(game, lobby.id));
  const memberRows = lobby.members.map((mem) => renderMember(mem));

  if (gameRows.length === 0) {
    gameRows.unshift(EMPTY_GAMES_TABLE_ROW);
  }

  const [nextModeQuery, toggleIcon] = toggleDetails(viewing);

  return (
    <section className="y-content x-gutters y-gutters">
      <header className="flex border-b border-gray-400 border-solid pb-3 mb-3 items-center">
        <h1>
          <b>{shortenName(lobby.name)}</b>
        </h1>
        <div className="ml-auto flex items-center">
          <Link to={{ search: nextModeQuery, pathname: `/lobbies/${lobby.id}` }} className="btn mr-2 sm:hidden">
            {toggleIcon}
          </Link>
          <Link to={`/lobbies/${lobby.id}/new-game`} className="btn block">
            <Icon icon="plus" />
          </Link>
        </div>
      </header>
      <section data-role="tables" className="flex items-start">
        <article data-role="user-table" className="w-full sm:w-6/12 sm:mr-2" data-mobile-visible={viewing === 'users'}>
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-full text-left">User</th>
                <th className="text-left">Joined</th>
              </tr>
            </thead>
            <tbody>{memberRows}</tbody>
          </table>
        </article>
        <article data-role="game-table" className="w-full sm:w-6/12 sm:ml-2" data-mobile-visible={viewing === 'games'}>
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-full text-left">Game</th>
                <th className="text-left">Started</th>
                <th className="text-left hidden md:table-cell">Rounds</th>
              </tr>
            </thead>
            <tbody>{gameRows}</tbody>
          </table>
        </article>
      </section>
    </section>
  );
}

export default AuthenticatedRoute(Lobby);
