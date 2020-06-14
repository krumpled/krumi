import axios from 'axios';
import debug from 'debug';
import config from '@krumpled/krumi/config';
import { Result, ok, err, camelizeKeys, underscoreKeys } from '@krumpled/krumi/std';

const log = debug('krumi:krumnet');

const authorization: { token: null | string } = { token: null };

export type QueuedJob = {
  id: string;
  result: null | {
    kind: string;
    data: {
      kind: string;
      data: { id: string };
    };
  };
};

export function setToken(token: string | null): void {
  authorization.token = token;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function authorizationHeaders(): object {
  return { Authorization: authorization.token };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function destroy(path: string, payload?: object): Promise<Result<object>> {
  const uri = `${config.krumnet.url}${path}`;
  log('DELETE to "%s"', uri);
  const headers = { ...authorizationHeaders() };

  try {
    const result = await axios.delete(uri, {
      headers,
      data: underscoreKeys(payload),
    });
    return ok(camelizeKeys(result.data));
  } catch (e) {
    return err([e]);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function fetch(path: string, params?: object): Promise<Result<object>> {
  const uri = `${config.krumnet.url}${path}`;
  log('fetching "%s"', uri);
  const headers = { ...authorizationHeaders() };

  try {
    const result = await axios(uri, {
      headers,
      params: underscoreKeys(params),
    });
    return ok(camelizeKeys(result.data));
  } catch (e) {
    return err([e]);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function post<T>(path: string, data?: T): Promise<Result<object>> {
  const uri = `${config.krumnet.url}${path}`;
  const headers = { ...authorizationHeaders() };
  log('posting to "%s"', uri);

  if (data) {
    log('serializing payload for network');
  }

  try {
    const { data: response } = await axios.post(uri, underscoreKeys(data), {
      headers,
    });
    return ok(camelizeKeys(response));
  } catch (error) {
    return err([error]);
  }
}
