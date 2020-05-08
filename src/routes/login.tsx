import React from 'react';
import { Redirect } from 'react-router-dom';
import { Session } from '@krumpled/krumi/session';
import { loginUrl } from '@krumpled/krumi/config';
import debug from 'debug';

const log = debug('krumi:routes.login');

function Login(props: {
  session: Session;
}): React.FunctionComponentElement<{}> {
  const { user } = props.session;
  log('rendering login route');

  switch (user.kind) {
    case 'none':
      return (
        <section data-role="login">
          <a href={loginUrl()}>Login</a>
        </section>
      );
    case 'some':
      return <Redirect to="/home" />;
  }
}

export default Login;
