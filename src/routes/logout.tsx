import React, { useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import debug from 'debug';
import { none } from '@krumpled/krumi/std';
import { loading, AsyncRequest } from '@krumpled/krumi/std/async-request';
import { Session, load as loadSession } from '@krumpled/krumi/session';
import config from '@krumpled/krumi/config';
import ApplicationLoading from '@krumpled/krumi/components/application-loading';

type State = {
  session: AsyncRequest<Session>;
};

const log = debug('krumi:logout');

function Logout({
  state,
  update,
}: {
  state: State;
  update: (state: State) => void;
}): React.FunctionComponentElement<{}> {
  const { session } = state;
  log('rendering logout route...');

  useEffect(() => {
    if (session.kind === 'not-asked') {
      update({ ...state, session: loading(loadSession(none())) });
    }
  });

  switch (session.kind) {
    case 'loaded': {
      const token = session.data.token;
      const destination = `${config.krumnet.url}/auth/destroy?token=${token}`;
      window.location.replace(destination);
      return <div></div>;
    }
    case 'not-asked':
    case 'loading':
      return <ApplicationLoading />;
    default:
      return <Redirect to="/" />;
  }
}

export default Logout;
