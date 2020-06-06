import React, { useEffect } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { load as loadSession } from '@krumpled/krumi/session';
import * as std from '@krumpled/krumi/std';
import { State } from '@krumpled/krumi/app-state';
import debug from '@krumpled/krumi/logging';

const log = debug('krumi:auth-callback');

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
    props.update({ session: std.loading(loadSession(std.fromNullable(token))) });
  });

  return <Redirect to="/" />;
}

export default AuthCallback;
