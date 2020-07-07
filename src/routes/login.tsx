import React from 'react';
import { Redirect } from 'react-router-dom';
import { Session } from '@krumpled/krumi/session';
import { loginUrl } from '@krumpled/krumi/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logger from '@krumpled/krumi/logging';

const log = logger('krumi:routes.login');

type Props = {
  session: Session;
};

function Login(props: Props): React.FunctionComponentElement<Props> {
  const { user } = props.session;
  log('rendering login route');

  if (user.kind === 'some') {
    return <Redirect to="/home" />;
  }

  return (
    <section data-role="login" className="py-10 x-gutters y-content text-center">
      <div className="hero px-8 py-8 margin-auto">
        <img
          src="https://picsum.photos/300/300.jpg"
          className="block rounded-full mx-auto border border-solid border-gray-500"
        />
      </div>
      <div className="inline-block text-center">
        <a href={loginUrl()} className="btn">
          <span className="text-blue-500">
            <FontAwesomeIcon icon={['fab', 'google']} /> Login with Google
          </span>
        </a>
      </div>
    </section>
  );
}

export default Login;
