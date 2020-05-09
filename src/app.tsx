import React, { useEffect, useState } from 'react';
import {
  Route,
  Redirect,
  Switch,
  BrowserRouter as Router,
  useLocation,
} from 'react-router-dom';
import { render } from 'react-dom';
import debug from 'debug';
import Header from '@krumpled/krumi/components/application-header';
import Footer from '@krumpled/krumi/components/application-footer';
import { none, fromNullable } from '@krumpled/krumi/std';
import {
  failed,
  loaded,
  loading,
  notAsked,
  AsyncRequest,
} from '@krumpled/krumi/std/async-request';
import { Session, load as loadSession } from '@krumpled/krumi/session';
import Login from '@krumpled/krumi/routes/login';
import Home from '@krumpled/krumi/routes/home';

const log = debug('krumi:app');

type State = {
  session: AsyncRequest<Session>;
};

function init(): State {
  return { session: notAsked() };
}

function AuthCallback(props: {
  update: (state: State) => void;
}): React.FunctionComponentElement<{}> {
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
      return (
        <main data-role="main" data-state="not-asked">
          <p>Loading...</p>
        </main>
      );
    case 'loaded':
      return (
        <Router>
          <Header key="header" />
          <Switch>
            <Route extact path="/login">
              <Login session={session.data} />
            </Route>
            <Route extact path="/account">
              <div>this is account</div>
            </Route>
            <Route extact path="/home">
              <Home session={session.data} />
            </Route>
            <Route>
              <Redirect to="/login" />
            </Route>
          </Switch>
          <Footer session={session.data} />
        </Router>
      );
    case 'failed':
      log('unable to load session %o', session.errors);
      return (
        <main data-role="main" data-state="failed">
          <p>The application is currently unavailable</p>
        </main>
      );
  }
}

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
