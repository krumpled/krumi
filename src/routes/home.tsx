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

  switch (user.kind) {
    case 'none':
      log('no current user, redirecting to loging');
      return <Redirect to="/login" />;
    case 'some':
      log('user logged in, rendering content');
      return (
        <section data-role="home">
          <p>home</p>
        </section>
      );
  }
}

export default Home;
