import React from 'react';
import { Link } from 'react-router-dom';
import { Session } from '@krumpled/krumi/session';
import debug from 'debug';

const log = debug('krumi:application-header');

function Header({ session }: { session: Session }): React.FunctionComponentElement<{}> {
  switch (session.user.kind) {
    case 'some': {
      log('rendering authed header for token: {}', session.token);
      return (
        <header className="flex bg-gray-900 x-gutters py-5 items-center">
          <aside data-role="header-left" className="flex items-center">
            <Link to="/home" className="block mr-5 pr-2">
              Home
            </Link>
            <Link to="/new-lobby" className="block px-2">
              New Lobby
            </Link>
          </aside>
          <aside data-role="header-right" className="ml-auto flex items-center">
            <p className="mr-3">{session.user.data.name}</p>
            <Link to="/auth/logout">logout</Link>
          </aside>
        </header>
      );
    }
    case 'none':
      return <header className="flex bg-gray-900 x-gutters py-5 items-center"></header>;
  }
}

export default Header;
