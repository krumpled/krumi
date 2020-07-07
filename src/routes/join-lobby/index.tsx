import React, { useState, useEffect } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import { Result, AsyncRequest, loading, failed, loaded, notAsked } from '@krumpled/krumi/std';
import { post } from '@krumpled/krumi/krumnet';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import debug from 'debug';

const log = debug('krumi:routes.join-lobby');

type State = {
  attempt: AsyncRequest<{ id: string }>;
};

type JoinResponse = {
  lobbyId: string;
};

function init(): State {
  return { attempt: notAsked() };
}

async function create(lobbyId: string): Promise<Result<JoinResponse>> {
  return (await post('/lobby-memberships', { lobbyId })) as Result<JoinResponse>;
}

async function createMembership(lobbyId: string): Promise<{ id: string }> {
  const res = await create(lobbyId);

  switch (res.kind) {
    case 'err': {
      const [e] = res.errors;
      return Promise.reject(e);
    }
    case 'ok':
      return { id: res.data.lobbyId };
  }
}

function JoinLobby(): React.FunctionComponentElement<unknown> {
  const [state, update] = useState(init());
  const { id } = useParams();

  useEffect(() => {
    if (state.attempt.kind !== 'not-asked') {
      return;
    }

    const promise = createMembership(id);
    update({ attempt: loading(promise) });
    promise.then((data) => update({ attempt: loaded(data) })).catch((e) => update({ attempt: failed([e]) }));

    log('sending join lobby "%s" attempt now', id);
  });

  switch (state.attempt.kind) {
    case 'not-asked':
    case 'loading':
      return <Loading />;
    case 'loaded':
      return <Redirect to={`/lobbies/${state.attempt.data.id}`} />;
    case 'failed':
      return <ApplicationError errors={state.attempt.errors} />;
  }
}

export default AuthenticatedRoute(JoinLobby);
