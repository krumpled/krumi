import axios from 'axios';
import debug from 'debug';
import config from '@krumpled/krumi/config';
import { Result, ok, err } from '@krumpled/krumi/std';

const log = debug('krumi:krumnet');

const authorization: { token: null | string } = { token: null };

export function setToken(token: string | null): void {
  authorization.token = token;
}

function authorizationHeaders(): object {
  return { Authorization: authorization.token };
}

export async function fetch(
  path: string,
  params?: object,
): Promise<Result<object>> {
  const uri = `${config.krumnet.url}${path}`;
  log('fetching "%s"', uri);
  const headers = { ...authorizationHeaders() };

  try {
    const result = await axios(uri, { headers, params });
    return ok(result.data);
  } catch (e) {
    return err([e]);
  }
}

export async function post<T>(path: string, data?: T): Promise<Result<object>> {
  const uri = `${config.krumnet.url}${path}`;
  const headers = { ...authorizationHeaders() };
  log('posting to "%s"', uri);

  if (data) {
    log('serializing payload for network');
  }

  try {
    const { data: response } = await axios.post(uri, data, { headers });
    return ok(response);
  } catch (e) {
    return err([e]);
  }
}
