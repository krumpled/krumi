import React from 'react';
import { Redirect } from 'react-router-dom';
import { Session, isAuthenticated } from '@krumpled/krumi/session';
import { always } from '@krumpled/krumi/std';

export type AuthenticatedRouteProps<T> = T & { session: Session };

export function AuthenticatedRoute<T>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  route: (props: T) => React.FunctionComponentElement<{}>,
  // eslint-disable-next-line @typescript-eslint/ban-types
): (props: AuthenticatedRouteProps<T>) => React.FunctionComponentElement<{}> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  function Inner(props: AuthenticatedRouteProps<T>): React.FunctionComponentElement<{}> {
    return isAuthenticated(props.session) ? route(props) : <Redirect to="/login" />;
  }

  Object.defineProperty(Inner, 'name', {
    get: always(`AuthenticatedRoute<${route.name}>`),
  });

  return Inner;
}
