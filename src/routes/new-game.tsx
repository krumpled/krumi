import React, { useEffect, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { createAndPoll } from '@krumpled/krumi/krumnet';
import { Result, underscoreKeys, AsyncRequest, notAsked, loading, failed, loaded } from '@krumpled/krumi/std';
import logger from '@krumpled/krumi/logging';

const log = logger('krumi:route.new-game');

type State = {
  lobbyId: string;
  request: AsyncRequest<Result<{ id: string }>>;
};

function init(): State {
  const { id: lobbyId } = useParams();
  return { lobbyId, request: notAsked() };
}

async function createGame(lobbyId: string): Promise<Result<{ id: string }>> {
  log('creating game for lobby "%s"', lobbyId);
  const game = await createAndPoll('/games', underscoreKeys({ lobbyId }));
  return game;
}

function NewGame(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    switch (state.request.kind) {
      case 'not-asked': {
        log('new game request no asked, sending now');
        const promise = createGame(state.lobbyId);

        update({ ...state, request: loading(promise) });

        promise
          .then((data) => update({ ...state, request: loaded(data) }))
          .catch((e) => update({ ...state, request: failed([e]) }));

        break;
      }
      case 'loaded': {
        const { data: result } = state.request;

        if (result.kind === 'err') {
          return;
        }

        const { id: gameId } = result.data;
        log('new game created - "%s"', gameId);
        break;
      }
      case 'loading':
        log('game creation in flight');
        break;
      case 'failed':
        log('game creation failed - %o', state.request.errors);
        break;
    }
  });

  const { request } = state;

  switch (request.kind) {
    case 'loading':
    case 'not-asked':
      return (
        <section className="y-content x-gutters y-gutters">
          <Loading />
        </section>
      );
    case 'loaded': {
      const { data: result } = request;

      if (result.kind === 'err') {
        return <ApplicationError errors={result.errors} />;
      }

      return <Redirect to={`/lobbies/${state.lobbyId}/games/${result.data.id}`} />;
    }
    case 'failed':
      return <ApplicationError errors={request.errors} />;
  }
}

export default AuthenticatedRoute(NewGame);
