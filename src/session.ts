import { fromNullable, none, Option } from '@krumpled/krumi/std';
import config from '@krumpled/krumi/config';
import { setToken, fetch } from '@krumpled/krumi/krumnet';
import debug from 'debug';

const log = debug('krumi:session');

export type CurrentUser = {
  name: string;
  email: string;
  id: string;
};

export type Session = {
  user: Option<CurrentUser>;
};

export async function load(token: Option<string>): Promise<Session> {
  log("attempting to load session, provided '%s'", token.kind);

  switch (token.kind) {
    case 'some': {
      setToken(token.data);

      try {
        const user = await fetch('/auth/identify');
        window.localStorage.setItem(config.session.key, token.data);
        return { user: fromNullable(user as CurrentUser) };
      } catch (e) {
        setToken(null);
        window.localStorage.removeItem(config.session.key);
        return { user: none() };
      }
    }
    case 'none': {
      const key = fromNullable(window.localStorage.getItem(config.session.key));

      await new Promise((resolve) => setTimeout(resolve, 2000));

      switch (key.kind) {
        case 'none':
          log('unable to find existing token in localstorage');
          return { user: none() };
        case 'some':
          setToken(key.data);
          log("loading sesion from '%o'", key);

          try {
            const user = await fetch('/auth/identify');
            return { user: fromNullable(user as CurrentUser) };
          } catch (e) {
            setToken(null);
            window.localStorage.removeItem(config.session.key);
            return { user: none() };
          }
      }
    }
  }
}
