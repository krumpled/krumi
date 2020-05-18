import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { Session } from '@krumpled/krumi/session';
import { fetch } from '@krumpled/krumi/krumnet';
import {
  AsyncRequest,
  failed,
  loaded,
  notAsked,
  loading,
} from '@krumpled/krumi/std';
import debug from 'debug';

const log = debug('krumi:route.lobby');

type Props = {
  session: Session;
};

type State = {
  id: string;
  data: AsyncRequest<{}>;
};

async function loadLobby(id: string): Promise<{ id: string }> {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await fetch(`/lobbies/${id}`);

  return { id };
}

function init(): State {
  const { id } = useParams();
  return { id, data: notAsked() };
}

function Lobby(props: Props): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());
  log('lobby for current user "%s"', props.session.token);

  useEffect(() => {
    switch (state.data.kind) {
      case 'not-asked': {
        log('lobby hasnt  been requested yet, sending request');
        const promise = loadLobby(state.id);
        update({ ...state, data: loading(promise) });
        promise
          .then((data) => update({ ...state, data: loaded(data) }))
          .catch((e) => update({ ...state, data: failed([e]) }));
        break;
      }
      case 'loading':
        log('state currently loading lobby');
        break;
      case 'loaded':
        log('lobby loaded successfully - %o', state.data.data);
        break;
      case 'failed':
        log('lobby failed load - %o', state.data.errors);
        break;
    }
  });

  switch (state.data.kind) {
    case 'loading':
    case 'not-asked':
      return <Loading />;
    case 'loaded':
      return (
        <section className="y-content x-gutters y-gutters">
          <aside data-role="sidebar">
            <Link to={`/lobbies/${state.id}/new-game`}>New Game</Link>
          </aside>
          <aside data-role="members"></aside>
          <aside data-role="other"></aside>
        </section>
      );
    case 'failed':
      return <ApplicationError errors={state.data.errors} />;
  }
}

export default AuthenticatedRoute(Lobby);
