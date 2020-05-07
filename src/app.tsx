import { Route, Link, Switch, BrowserRouter as Router } from 'react-router-dom';
import Head from '@krumpled/krumi/components/application-head';
import Foot from '@krumpled/krumi/components/application-footer';
import React from 'react';

export default function run() {
  return (
    <Router>
      <Head />
        <Switch>
          <Route path='/login'>
            I am login
          </Route>
          <Route>
            <Link to='/login'>Login</Link>
          </Route>
        </Switch>
      <Foot />
    </Router>
  );
}
