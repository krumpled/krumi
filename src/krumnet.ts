import axios from 'axios';
import debug from 'debug';
import config from '@krumpled/krumi/config';
import {
  Result,
  ok,
  err,
  camelizeKeys,
  underscoreKeys,
} from '@krumpled/krumi/std';

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
    const result = await axios(uri, {
      headers,
      params: underscoreKeys(params),
    });
    return ok(camelizeKeys(result.data));
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
    const { data: response } = await axios.post(uri, underscoreKeys(data), {
      headers,
    });
    return ok(camelizeKeys(response));
  } catch (e) {
    return err([e]);
  }
}

export async function createAndPoll<T>(
  path: string,
  data?: T,
): Promise<Result<{ id: string }>> {
  const job = (await post(path, data)) as Result<{ id: string }>;

  if (job.kind === 'err') {
    return job;
  }

  let count = 0;
  const query = { id: job.data.id };

  while (++count < 1000) {
    const job = (await fetch('/jobs', query)) as Result<QueuedJob>;

    if (job.kind === 'err') {
      return job;
    }

    if (job.data.result) {
      const { id } = job.data.result.data.data;
      log('job has finished w/ result %o', id);
      return ok({ id });
    }

    log('lobby "%s" still provisioning, delay + continue', job.data.id);
    await new Promise((resolve) => setTimeout(resolve, 1000 + count * 100));
  }

  return err([
    new Error(`job ${job.data.id} not finished after ${count} attempts`),
  ]);
}
