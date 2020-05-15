import {
  mapOption as mapMaybe,
  resultToMaybe,
  Result,
  fromNullable,
  none,
  Option,
} from '@krumpled/krumi/std';
import config from '@krumpled/krumi/config';
import { setToken, fetch } from '@krumpled/krumi/krumnet';
import debug from 'debug';

const log = debug('krumi:session');

type SessionPayload = {
  user: CurrentUser;
};

export type CurrentUser = {
  name: string;
  email: string;
  id: string;
};

export type Session = {
  user: Option<CurrentUser>;
  token?: string;
};

export function isAuthenticated(session: Session): boolean {
  return session.user.kind === 'some';
}

function reset(): Session {
  setToken(null);
  window.localStorage.removeItem(config.session.key);
  return { user: none() };
}

async function loadFromToken(token: string): Promise<Session> {
  setToken(token);

  try {
    const result = (await fetch('/auth/identify')) as Result<SessionPayload>;
    window.localStorage.setItem(config.session.key, token);
    const user = mapMaybe(resultToMaybe(result), ({ user }) => user);
    return { user, token };
  } catch (e) {
    log('unable to fetch user information using token "%s": %s', token, e);
    return reset();
  }
}

async function loadFromStorage(): Promise<Session> {
  const key = fromNullable(window.localStorage.getItem(config.session.key));
  switch (key.kind) {
    case 'none':
      log('unable to find existing token in localstorage');
      return { user: none() };
    case 'some': {
      const { data: token } = key;
      setToken(token);
      log("loading sesion from '%o'", key);

      try {
        const result = (await fetch('/auth/identify')) as Result<
          SessionPayload
        >;

        const user = mapMaybe(resultToMaybe(result), ({ user }) => user);
        return { user, token: key.data };
      } catch (e) {
        log('unable to fetch user information using token "%s": %s', token, e);
        return reset();
      }
    }
  }
}

export async function load(token: Option<string>): Promise<Session> {
  log("attempting to load session, provided '%s'", token.kind);
  return token.kind === 'some' ? loadFromToken(token.data) : loadFromStorage();
}
