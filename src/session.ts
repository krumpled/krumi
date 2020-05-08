import { fromNullable, none, Option } from '@krumpled/krumi/std';
import config from '@krumpled/krumi/config';
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

export async function load(): Promise<Session> {
  const key = fromNullable(window.localStorage.getItem(config.session.key));

  await new Promise((resolve) => setTimeout(resolve, 2000));

  switch (key.kind) {
    case 'none':
      log('unable to find existing token in localstorage');
      return { user: none() };
    case 'some':
      log("loading sesion from '%o'", key);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return { user: none() };
  }
}
