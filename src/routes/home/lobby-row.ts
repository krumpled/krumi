import { AsyncRequest, loading, notAsked } from '@krumpled/krumi/std';

export type LobbyInfo = {
  id: string;
  name: string;
  created: number;
  memberCount: number;
  gameCount: number;
  action: AsyncRequest<string>;
};

export function leaving(
  lobby: Omit<LobbyInfo, 'action'>,
  promise: Promise<string>,
): LobbyInfo {
  return { ...lobby, action: loading(promise) };
}

export function initial(info: Omit<LobbyInfo, 'action'>): LobbyInfo {
  return { ...info, action: notAsked() };
}
