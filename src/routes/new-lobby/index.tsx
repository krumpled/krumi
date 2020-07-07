import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import debug from 'debug';
import Loading from '@krumpled/krumi/components/application-loading';
import { Session } from '@krumpled/krumi/session';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import { Result, AsyncRequest, loading, notAsked, loaded, resultToPromise } from '@krumpled/krumi/std';
import { post } from '@krumpled/krumi/krumnet';

const log = debug('krumi:route.new-lobby');

export type Props = {
  session: Session;
};

export type Job = {
  id: string;
};

export type State = {
  job: AsyncRequest<Job>;
};

function init(): State {
  return { job: notAsked() };
}

async function create(): Promise<Job> {
  const payload = { kind: `${window.performance.now()}` };
  const job = (await post('/lobbies', payload)) as Result<{ id: string }>;
  return resultToPromise(job);
}

function NewLobby(): React.FunctionComponentElement<unknown> {
  const [state, update] = useState(init());

  useEffect(() => {
    const semo = { done: false };

    if (state.job.kind === 'not-asked') {
      log('job not yet created, attemping to create');
      const promise = create();
      update({ job: loading(promise) });
    } else if (state.job.kind === 'loading') {
      log('request sent, adding callbacks');
      state.job.promise
        .then((job) => loaded(job))
        .then((job) => {
          log('job created, semo done? "%s"', semo.done);
          if (!semo.done) {
            update({ job });
          }
        });
    }

    return (): void => {
      log('cleaning up effect at state "%s"', state.job.kind);
      semo.done = true;
    };
  });

  if (state.job.kind !== 'loaded') {
    return <Loading />;
  }

  return <Redirect to={`/poll-lobby/${state.job.data.id}`} />;
}

export default AuthenticatedRoute(NewLobby);
