import React, { useEffect, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import * as std from '@krumpled/krumi/std';
import { fetch } from '@krumpled/krumi/krumnet';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import logger from '@krumpled/krumi/logging';

const log = logger('krumi:route.new-game.poll');

type State = {
  lobbyId: string;
  gameId: string;
  result: std.AsyncRequest<{ id: std.Option<string> }>;
};

function init(gameId: string, lobbyId: string): State {
  return { gameId, lobbyId, result: std.notAsked() };
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

  const result = (await fetch('/jobs', { id: state.gameId })) as std.Result<PolledJob>;

  return std
    .resultToPromise(result)
    .then((polledJob) => std.fromNullable(polledJob.result))
    .then((maybeResult) => std.mapOption(maybeResult, (res) => res.data.data.id))
    .then((id) => ({ id }));
}

// eslint-disable-next-line @typescript-eslint/ban-types
function PollGame(): React.FunctionComponentElement<{}> {
  const { lobbyId, gameId } = useParams();
  const [state, update] = useState(init(gameId, lobbyId));

  useEffect(() => {
    const semo = { done: false };

    if (state.result.kind === 'not-asked') {
      const attempt = poll(state);
      update({ ...state, result: std.loading(attempt) });
    }

    if (state.result.kind !== 'loading') {
      return;
    }

    const { promise: pollPromise } = state.result;

    pollPromise
      .then((pollResult) => {
        const next = pollResult.id.kind === 'none' ? std.loading(poll(state)) : std.loaded({ id: pollResult.id });
        log('poll result done - semo "%s"', semo.done);
        return semo.done ? std.noop() : update({ ...state, result: next });
      })
      .catch((error) => update({ ...state, result: std.failed([error]) }));

    return (): void => std.noop((semo.done = true));
  });

  if (state.result.kind === 'loading' || state.result.kind === 'not-asked') {
    return <Loading />;
  } else if (state.result.kind === 'failed') {
    return <ApplicationError errors={state.result.errors} />;
  }

  if (state.result.data.id.kind === 'none') {
    return <Redirect to="/home" />;
  }

  return <Redirect to={`/lobbies/${state.lobbyId}/games/${state.result.data.id.data}`} />;
}

export default AuthenticatedRoute(PollGame);
