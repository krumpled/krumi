import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import moment from 'moment';
import { fetch } from '@krumpled/krumi/krumnet';
import { Result, AsyncRequest, failed, loaded, notAsked, loading } from '@krumpled/krumi/std';
import debug from 'debug';

const log = debug('krumi:route.lobby');

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
  data: AsyncRequest<{ lobby: LobbyDetailResponse }>;
};

async function loadLobby(id: string): Promise<LobbyDetailResponse> {
  const detail = (await fetch(`/lobbies`, { ids: [id] })) as Result<LobbyDetailResponse>;

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

function renderGame(game: LobbyGame, lobbyId: string): React.FunctionComponentElement<{}> {
  const created = moment(game.created);
  log('rendering game created on "%s"', created.fromNow());
  return (
    <tr data-role="game" className="py-2 px-3 text-left" key={game.id} data-rounds-remaining={game.roundsRemaining}>
      <td className="px-3 py-2">
        <Link to={`/lobbies/${lobbyId}/games/${game.id}`} className="block pr-2">
          {game.name}
        </Link>
      </td>
      <td className="px-3 py-2">
        created <span>{created.fromNow()}</span>
      </td>
      <td className="px-3 py-2">
        <span>{game.roundsRemaining}</span>
      </td>
    </tr>
  );
}

function renderMember(member: LobbyMember): React.FunctionComponentElement<{}> {
  const joinedAt = member.joinedAt ? moment(member.joinedAt).fromNow() : '';
  return (
    <tr data-member-user-id={member.userId} key={member.memberId} data-member-membership-id={member.memberId}>
      <td className="text-left px-3 py-2">{member.name}</td>
      <td className="text-left px-3 py-2">{joinedAt}</td>
    </tr>
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
        <tr>
          <td colSpan={3} className="px-3 py-2">
            <Link to={`/lobbies/${state.id}/new-game`}>New Game</Link>
          </td>
        </tr>
      );
      const memberRows = lobby.members.map(renderMember);
      return (
        <section className="y-content x-gutters y-gutters flex">
          <aside data-role="games" className="pr-4">
            <header className="flex items-center pb-2 block mb-2">
              <h4 className="block pr-2">
                Lobby <b>{lobby.name}</b> Games
              </h4>
              <Link to={`/lobbies/${state.id}/new-game`}>New</Link>
            </header>
            <table>
              <thead>
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Started</th>
                  <th className="text-left px-3 py-2">Rounds Remaining</th>
                </tr>
              </thead>
              <tbody>{games}</tbody>
            </table>
          </aside>
          <aside data-role="members" className="px-4">
            <header className="block items-center pb-2 block mb-2">
              <h4>Members</h4>
            </header>
            <table>
              <thead>
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>{memberRows}</tbody>
            </table>
          </aside>
        </section>
      );
    }
    case 'failed':
      return <ApplicationError errors={state.data.errors} />;
  }
}

export default AuthenticatedRoute(Lobby);
