import config from '@krumpled/krumi/config';
import axios from 'axios';
import debug from 'debug';

const log = debug('krumi:krumnet');

const authorization: { token: null | string } = { token: null };

export function setToken(token: string | null): void {
  authorization.token = token;
}

export async function fetch(path: string): Promise<object> {
  const uri = `${config.krumnet.url}${path}`;
  log('fetching "%s"', uri);
  const headers = { Authorization: authorization.token };
  const result = await axios(uri, { headers });
  return result.data;
}
