import config from '@krumpled/krumi/config';
import axios from 'axios';
import debug from 'debug';

const log = debug('krumi:krumnet');

const authorization: { token: null | string } = { token: null };

export function setToken(token: string | null): void {
  authorization.token = token;
}

function authorizationHeaders(): object {
  return { Authorization: authorization.token };
}

export async function fetch(path: string): Promise<object> {
  const uri = `${config.krumnet.url}${path}`;
  log('fetching "%s"', uri);
  const headers = { ...authorizationHeaders() };
  const result = await axios(uri, { headers });
  return result.data;
}

export async function post<T>(path: string, data?: T): Promise<object> {
  const uri = `${config.krumnet.url}${path}`;
  const headers = { ...authorizationHeaders() };
  log('posting to "%s"', uri);

  if (data) {
    log('serializing payload for network');
  }

  await axios.post(uri, data, { headers });

  return {};
}
