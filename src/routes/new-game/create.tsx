import React, { useEffect, useState } from 'react';
import { Link, Redirect, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { post } from '@krumpled/krumi/krumnet';
import * as std from '@krumpled/krumi/std';
import logger from '@krumpled/krumi/logging';
import { extractServerError } from '@krumpled/krumi/errors';

const log = logger('krumi:route.new-game.create');

type State = {
  lobbyId: string;
  request: std.AsyncRequest<{ id: string }>;
};

function init(): State {
  const { id: lobbyId } = useParams();
  return { lobbyId, request: std.notAsked() };
}

function createForLobby(lobbyId: string): Promise<std.Result<{ id: string }>> {
  const payload = std.underscoreKeys({ lobbyId });
  return post('/games', payload) as Promise<std.Result<{ id: string }>>;
}

function NewGame(): React.FunctionComponentElement<unknown> {
  const [state, update] = useState(init());

  useEffect(() => {
    if (state.request.kind !== 'not-asked') {
      return;
    }

    log('creating game for "%s"', state.lobbyId);
    const request = createForLobby(state.lobbyId).then(std.resultToPromise);

    request
      .then(std.loaded)
      .then((request) => update({ ...state, request }))
      .catch((error) => update({ ...state, request: std.failed([error]) }));

    update({ ...state, request: std.loading(request) });
  });

  if (state.request.kind === 'loading' || state.request.kind === 'not-asked') {
    return <Loading />;
  } else if (state.request.kind === 'failed') {
    const [error] = state.request.errors;
    const serverError = extractServerError(error);

    if (serverError.kind === 'none') {
      return <ApplicationError errors={state.request.errors} />;
    }

    switch (serverError.data.message) {
      case 'errors.games.not_enough_members':
        return (
          <section className="x-gutters y-gutters text-center">
            <h3 className="mb-2 text-center">Not enough members, share the lobby code!</h3>
            <Link to={`/lobbies/${state.lobbyId}`} className="text-center inline-block">
              Return to Lobby
            </Link>
          </section>
        );
      default:
        return <Redirect to={`/lobbies/${state.lobbyId}`} />;
    }
  }

  return <Redirect to={`/lobbies/${state.lobbyId}/poll-game/${state.request.data.id}`} />;
}

export default AuthenticatedRoute(NewGame);
