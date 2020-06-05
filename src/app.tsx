import React, { useEffect, useState } from 'react';
import { Route, Redirect, Switch, BrowserRouter as Router, useLocation } from 'react-router-dom';
import { render } from 'react-dom';
import debug from 'debug';
import Header from '@krumpled/krumi/components/application-header';
import Loading from '@krumpled/krumi/components/application-loading';
import ApplicationError from '@krumpled/krumi/components/application-error';
import { none, fromNullable } from '@krumpled/krumi/std';
import { failed, loaded, loading, notAsked, AsyncRequest } from '@krumpled/krumi/std/async-request';
import { Session, load as loadSession } from '@krumpled/krumi/session';
import * as Routes from '@krumpled/krumi/routes';

const log = debug('krumi:app');

type State = {
  session: AsyncRequest<Session>;
};

function init(): State {
  return { session: notAsked() };
}

// The AuthCallback route handles pulling the token out of the url query params and attempting to load the session
// using it, immediately calling the update of our `Main` state and rendering a redirect back to home.
function AuthCallback(props: { update: (state: State) => void }): React.FunctionComponentElement<{}> {
  const { search } = useLocation();

  const [[, token] = []] = search
    .split('?')
    .reduce((acc, sides) => [...acc, ...sides.split('&')], new Array<string>())
    .map((pair) => pair.split('='))
    .filter(([key]) => key === 'token');

  if (!token) {
    return <Redirect to="/" />;
  }

  useEffect(() => {
    log('initiating token exchange');
    props.update({ session: loading(loadSession(fromNullable(token))) });
  });

  return <Redirect to="/" />;
}

function Main(props: { state: State }): React.FunctionComponentElement<{}> {
  const [state, update] = useState(props.state);
  log('rendering the main application content');

  useEffect(function () {
    log('application main effect - %o', state);

    switch (state.session.kind) {
      case 'loading': {
        log('session request pending, waiting and sending update');
        state.session.promise
          .then((data) => update({ ...state, session: loaded(data) }))
          .catch((e) => update({ ...state, session: failed([e]) }));
        break;
      }
      case 'not-asked': {
        log('session still uninitialized, initiating request now');
        update({ session: loading(loadSession(none())) });
        break;
      }
      default: {
        log('update w/ strange session state "%s"', state.session.kind);
      }
    }
  });

  const { session } = state;

  switch (session.kind) {
    case 'not-asked':
    case 'loading':
      return <Loading />;
    case 'loaded':
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
    case 'failed':
      log('unable to load session %o', session.errors);
      return <ApplicationError errors={session.errors} />;
  }
}

// The App componet inititalizes it's sesison state to `not-asked`, letting either the `Main` component **or** the
// `/auth/callback` route `update` to a `loading` state.
function App(): React.FunctionComponentElement<{}> {
  const [state, update] = useState(init());

  useEffect(() => {
    log('application render, session currently "%s"', state.session.kind);

    switch (state.session.kind) {
      case 'loading':
        debug('session in a loading state, queing updates on resolution');
        state.session.promise
          .then((sesion) => update({ ...state, session: loaded(sesion) }))
          .catch((error) => update({ ...state, session: failed([error]) }));
    }
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
