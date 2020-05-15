import React from 'react';
import { Redirect } from 'react-router-dom';
import { Session } from '@krumpled/krumi/session';
import debug from 'debug';

const log = debug('krumi:route.home');

export type Props = {
  session: Session;
};

function Home(props: Props): React.FunctionComponentElement<{}> {
  const { user } = props.session;

  if (user.kind === 'none') {
    log('no current user, redirecting to loging');
    return <Redirect to="/login" />;
  }

  log('user logged in, rendering content');
  return (
    <section data-role="home" className="x-gutters y-content py-5">
      <aside>Hello</aside>
    </section>
  );
}

export default Home;
