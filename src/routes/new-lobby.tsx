import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import debug from 'debug';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { Session, isAuthenticated } from '@krumpled/krumi/session';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import {
  AsyncRequest,
  loading,
  notAsked,
  loaded,
  failed,
  Result,
} from '@krumpled/krumi/std';
import { createAndPoll } from '@krumpled/krumi/krumnet';

const log = debug('krumi:route.new-lobby');

export type Props = {
  session: Session;
};

export type State = {
  attempt: AsyncRequest<Result<{ id: string }>>;
};

async function createLobby(): Promise<Result<{ id: string }>> {
  log('attempting to create a new lobby');
  const data = { kind: `${window.performance.now()}` };
  const lobby = await createAndPoll('/lobbies', data);
  return lobby;
}

function init(): State {
  return { attempt: notAsked() };
}

function NewLobby(props: Props): React.FunctionComponentElement<{}> {
  log('kicking off a new lobby, hopefully');

  if (!isAuthenticated(props.session)) {
    return <Redirect to="/login" />;
  }

  const [state, update] = useState(init());

  useEffect(() => {
    switch (state.attempt.kind) {
      case 'not-asked':
        log('provisioning attempt initializing');
        update({ ...state, attempt: loading(createLobby()) });
        break;
      case 'loading':
        log('new lobby request is in flight, awaiting promise');
        state.attempt.promise
          .then((res) => update({ ...state, attempt: loaded(res) }))
          .catch((e) => update({ ...state, attempt: failed([e]) }));
        break;
      case 'loaded':
        log('new lobby request finished - %o', state.attempt.data);
        break;
      case 'failed':
        log('new lobby attempt failed - %o', state.attempt.errors);
        break;
    }
  });

  switch (state.attempt.kind) {
    case 'not-asked':
    case 'loading':
      return (
        <section className="y-content">
          <Loading />
        </section>
      );
    case 'loaded': {
      const { data: attempt } = state.attempt;

      if (attempt.kind === 'err') {
        return <ApplicationError errors={attempt.errors} />;
      }

      log('successfully loaded - %o', attempt.data);
      const { id } = attempt.data;
      return <Redirect to={`/lobbies/${id}`} />;
    }
    case 'failed':
      return <ApplicationError errors={state.attempt.errors} />;
  }
}

export default AuthenticatedRoute(NewLobby);
