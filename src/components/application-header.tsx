import React from 'react';
import { Session } from '@krumpled/krumi/session';
import config from '@krumpled/krumi/config';
import debug from 'debug';

const log = debug('krumi:application-header');

function Header({
  session,
}: {
  session: Session;
}): React.FunctionComponentElement<{}> {
  switch (session.user.kind) {
    case 'some': {
      log(
        'user authenticated, rendering authed header for token: {}',
        session.token,
      );
      const logout = `${config.krumnet.url}/auth/destroy?token=${session.token}`;
      return (
        <header>
          <a href={logout}>logout</a>
        </header>
      );
    }
    case 'none':
      log('no user, rendering unauth header');
      return <header></header>;
  }
}

export default Header;
