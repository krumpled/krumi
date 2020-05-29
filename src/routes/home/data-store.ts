import { Result, camelizeKeys } from '@krumpled/krumi/std';
import { destroy, fetch } from '@krumpled/krumi/krumnet';
import { LobbyInfo, initial as initializeLobbyInfo } from '@krumpled/krumi/routes/home/lobby-row';
import debug from 'debug';

const log = debug('krumi:route.home.data-store');

type LobbyResponseLobby = {
  id: string;
  name: string;
  created: number;
  memberCount: number;
  gameCount: number;
};

type LobbyResponse = {
  lobbies: Array<LobbyResponseLobby>;
};

export async function leaveLobby(lobby: LobbyInfo): Promise<string> {
  log('leaving lobby "%s"', lobby.name);
  await destroy('/lobby-memberships', { lobbyId: lobby.id });
  log('left lobby "%s"', lobby.name);
  return lobby.id;
}

export async function loadLobbies(): Promise<Array<LobbyInfo>> {
  const data = camelizeKeys(await fetch('/lobbies')) as Result<LobbyResponse>;

  if (data.kind === 'err') {
    return Promise.reject(data.errors);
  }

  log('lobby data fetched from api - %o', data);

  const { lobbies } = data.data;
  return lobbies.map(initializeLobbyInfo);
}
