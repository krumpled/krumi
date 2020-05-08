import React, { useEffect, useState } from 'react';
import {
  Route,
  Redirect,
  Switch,
  BrowserRouter as Router,
} from 'react-router-dom';
import { render } from 'react-dom';
import debug from 'debug';
import Header from '@krumpled/krumi/components/application-header';
import Footer from '@krumpled/krumi/components/application-footer';
import config from '@krumpled/krumi/config';
import {
  failed,
  loaded,
  loading,
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
  return { session: loading(loadSession()) };
}

function App(): React.FunctionComponentElement<{}> {
  log('krumi-config: %j', config);
  const [initial, update] = useState(init());

  useEffect(function () {
    log('application main effect - %o', initial);

    switch (initial.session.kind) {
      case 'loading': {
        log('session request pending, waiting and sending update');
        initial.session.promise
          .then((data) => update({ ...initial, session: loaded(data) }))
          .catch((e) => update({ ...initial, session: failed([e]) }));
        break;
      }
      case 'not-asked': {
        log('session not asked');
        break;
      }
      default: {
        log('update w/ strange session state "%s"', initial.session.kind);
      }
    }
  });

  const { session } = initial;

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

function run(): void {
  render(<App />, document.getElementById('main'));
}

export default run;
