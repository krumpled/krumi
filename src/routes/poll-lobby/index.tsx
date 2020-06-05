import React, { useState, useEffect } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import * as std from '@krumpled/krumi/std';
import { fetch } from '@krumpled/krumi/krumnet';
import debug from 'debug';

const log = debug('krumi:routes.poll-lobby');

type State = {
  jobId: string;
  result: std.AsyncRequest<{ id: std.Option<string> }>;
};

function init(): State {
  const { id } = useParams();
  return { jobId: id, result: std.notAsked() };
}

type JobResult = {
  data: {
    data: { id: string };
  };
};

type PolledJob = {
  id: string;
  result: null | JobResult;
};

async function poll(state: State): Promise<{ id: std.Option<string> }> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (state.jobId === 'hang') {
    return { id: std.none() };
  }

  const result = (await fetch('/jobs', { id: state.jobId })) as std.Result<PolledJob>;
  return std
    .resultToPromise(result)
    .then((polledJob) => std.fromNullable(polledJob.result))
    .then((maybeResult) => std.mapOption(maybeResult, (res) => res.data.data.id))
    .then((id) => ({ id }));
}

function PollLobby(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    const semo = { done: false };

    if (state.result.kind === 'not-asked') {
      const attempt = poll(state);
      update({ ...state, result: std.loading(attempt) });
    }

    if (state.result.kind !== 'loading') {
      return;
    }

    log('polling attempt sent, adding listeners');

    state.result.promise
      .then((pollResult) => {
        const next = pollResult.id.kind === 'none' ? std.loading(poll(state)) : std.loaded({ id: pollResult.id });
        log('poll result done - semo "%s"', semo.done);
        return semo.done ? std.noop() : update({ ...state, result: next });
      })
      .catch((error) => update({ ...state, result: std.failed([error]) }));

    return (): void => std.noop((semo.done = true));
  });

  if (state.result.kind === 'failed') {
    return <ApplicationError errors={state.result.errors} />;
  } else if (state.result.kind !== 'loaded') {
    return <Loading data-state={state.jobId} />;
  }

  const destination = std.unwrapOptionOr(
    std.mapOption(state.result.data.id, (id) => `/lobbies/${id}`),
    '/home',
  );

  return <Redirect to={destination} />;
}

export default AuthenticatedRoute(PollLobby);
