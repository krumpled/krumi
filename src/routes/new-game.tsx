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
  err,
} from '@krumpled/krumi/std';
import { post, fetch } from '@krumpled/krumi/krumnet';

const log = debug('krumi:route.new-game');

export type Props = {
  session: Session;
};

export type State = {
  attempt: AsyncRequest<Result<{ id: string }>>;
};

async function createAndPoll(): Promise<Result<{ id: string }>> {
  log('attempting to create a new game');

  const lobby = (await post('/lobbies', {
    kind: `${window.performance.now()}`,
  })) as Result<{
    id: string;
  }>;

  if (lobby.kind === 'err') {
    return lobby;
  }

  let count = 0;

  while (++count < 1000) {
    const job = (await fetch('/jobs', { id: lobby.data.id })) as Result<{
      id: string;
      result: null | {};
    }>;

    if (job.kind === 'err') {
      return job;
    }

    if (job.data.result) {
      log('lobby provisioning started (%o), polling for finish', lobby);
      return job;
    }

    log('lobby "%s" still provisioning, delay + continue', job.data.id);
    await new Promise((resolve) => setTimeout(resolve, 1000 + count * 100));
  }

  return err([new Error('too many attempts')]);
}

function init(): State {
  return { attempt: notAsked() };
}

function NewGame(props: Props): React.FunctionComponentElement<{}> {
  log('kicking off a new game, hopefully');

  if (!isAuthenticated(props.session)) {
    return <Redirect to="/login" />;
  }

  const [state, update] = useState(init());

  useEffect(() => {
    switch (state.attempt.kind) {
      case 'not-asked':
        log('provisioning attempt initializing');
        update({ ...state, attempt: loading(createAndPoll()) });
        break;
      case 'loading':
        log('new game request is in flight, awaiting promise');
        state.attempt.promise
          .then((res) => update({ ...state, attempt: loaded(res) }))
          .catch((e) => update({ ...state, attempt: failed([e]) }));
        break;
      case 'loaded':
        log('new game request finished - %o', state.attempt.data);
        break;
      case 'failed':
        log('new game attempt failed - %o', state.attempt.errors);
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

export default AuthenticatedRoute(NewGame);
