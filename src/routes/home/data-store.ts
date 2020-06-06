import { Result, camelizeKeys } from '@krumpled/krumi/std';
import { destroy, fetch } from '@krumpled/krumi/krumnet';
import { LobbyInfo, initial as initializeLobbyInfo } from '@krumpled/krumi/routes/home/lobby-row';
import debug from '@krumpled/krumi/logging';

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
  await destroy('/lobby-memberships', { lobbyId: lobby.id });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  log('left lobby "%s"', lobby.name);
  return lobby.id;
}

export async function loadLobbies(): Promise<Array<LobbyInfo>> {
  const data = camelizeKeys(await fetch('/lobbies')) as Result<LobbyResponse>;

  if (data.kind === 'err') {
    log('[warning] unable to fetch lobbies - "%s"', data.errors.map((e) => e.message).join(','));
    return Promise.reject(data.errors);
  }

  const { lobbies } = data.data;
  return lobbies.map(initializeLobbyInfo);
}
