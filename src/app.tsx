import React, { useEffect, useState } from 'react';
import { Route, Redirect, Switch, BrowserRouter as Router } from 'react-router-dom';
import { render } from 'react-dom';
import Header from '@krumpled/krumi/components/application-header';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { none } from '@krumpled/krumi/std';
import { failed, loaded, loading } from '@krumpled/krumi/std/async-request';
import { load as loadSession } from '@krumpled/krumi/session';
import debug, { setContextValue } from '@krumpled/krumi/logging';
import * as Routes from '@krumpled/krumi/routes';
import { init, State } from '@krumpled/krumi/app-state';
import AuthCallback from '@krumpled/krumi/auth-callback';

const log = debug('krumi:app');

function Main(props: { state: State }): React.FunctionComponentElement<{}> {
  const [state, update] = useState(props.state);

  useEffect(function () {
    if (state.session.kind === 'loading') {
      log('session request pending, waiting and sending update');
      state.session.promise
        .then((data) => update({ ...state, session: loaded(data) }))
        .catch((e) => update({ ...state, session: failed([e]) }));
    } else if (state.session.kind === 'not-asked') {
      log('session still uninitialized, initiating request now');
      update({ session: loading(loadSession(none())) });
    } else if (state.session.kind === 'loaded') {
      const { user } = state.session.data;

      if (user.kind === 'some') {
        const { id } = user.data;
        log('session loaded w/ active user "%s"', id);
        setContextValue('userId', id);
      }
    }
  });

  const { session } = state;

  if (session.kind === 'not-asked' || session.kind === 'loading') {
    return <Loading />;
  } else if (session.kind === 'failed') {
    return <ApplicationError errors={session.errors} />;
  }

  return (
    <section data-role="loaded-session" className="main-contents">
      <Header key="header" session={session.data} />
      <Switch>
        <Route extact path="/login">
          <Routes.Login session={session.data} />
        </Route>
        <Route extact path="/home">
          <Routes.Home session={session.data} />
        </Route>
        <Route extact path="/poll-lobby/:id">
          <Routes.PollLobby session={session.data} />
        </Route>
        <Route extact path="/join-lobby/:id">
          <Routes.JoinLobby session={session.data} />
        </Route>
        <Route extact path="/lobbies/:id/new-game">
          <Routes.NewGame session={session.data} />
        </Route>
        <Route extact path="/lobbies/:lobbyId/games/:gameId">
          <Routes.Game session={session.data} />
        </Route>
        <Route extact path="/lobbies/:id">
          <Routes.Lobby session={session.data} />
        </Route>
        <Route extact path="/new-lobby">
          <Routes.NewLobby session={session.data} />
        </Route>
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    </section>
  );
}

// The App componet inititalizes it's sesison state to `not-asked`, letting either the `Main` component **or** the
// `/auth/callback` route `update` to a `loading` state.
function App(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    if (state.session.kind !== 'loading') {
      return;
    }

    log('session in a loading state, queing updates on resolution');
    state.session.promise
      .then((sesion) => update({ ...state, session: loaded(sesion) }))
      .catch((error) => update({ ...state, session: failed([error]) }));
  });

  return (
    <Router>
      <Switch>
        <Route path="/auth/logout">
          <Routes.Logout state={state} update={(state): void => update(state)} />
        </Route>
        <Route path="/auth/callback">
          <AuthCallback update={(state): void => update(state)} />
        </Route>
        <Route>
          <Main state={state} />
        </Route>
      </Switch>
    </Router>
  );
}

function run(): void {
  render(<App />, document.getElementById('main'));
}

export default run;
