import React from 'react';
import { Link } from 'react-router-dom';
import { Session } from '@krumpled/krumi/session';
import Icon from '@krumpled/krumi/components/icon';

function Header({ session }: { session: Session }): React.FunctionComponentElement<{}> {
  if (session.user.kind === 'none') {
    return <header className="flex bg-gray-900 x-gutters py-5 items-center"></header>;
  }

  const { name } = session.user.data;

  return (
    <header className="flex bg-gray-900 x-gutters py-5 items-center text-gray-100">
      <aside data-role="header-left" className="flex items-center">
        <Link to="/home" className="block mr-5 pr-2">
          <Icon icon="home" />
        </Link>
      </aside>

      <aside data-role="header-right" className="ml-auto flex items-center">
        <p className="mr-3">{name}</p>
        <Link to="/auth/logout">
          <Icon icon="sign-out-alt" />
        </Link>
      </aside>
    </header>
  );
}

export default Header;
