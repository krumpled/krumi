import React from 'react';
import { Link } from 'react-router-dom';
import { Session } from '@krumpled/krumi/session';
import debug from 'debug';

const log = debug('krumi:application-header');

function Header({
  session,
}: {
  session: Session;
}): React.FunctionComponentElement<{}> {
  switch (session.user.kind) {
    case 'some': {
      log('rendering authed header for token: {}', session.token);
      return (
        <header>
          <aside>
            <Link to="/auth/logout">logout</Link>
            <p>{session.user.data.name}</p>
          </aside>
        </header>
      );
    }
    case 'none':
      log('no user, rendering unauth header');
      return <header></header>;
  }
}

export default Header;
