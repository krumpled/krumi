import React from 'react';
import { AuthenticatedRoute } from '@krumpled/krumi/routing-utilities';

function Lobby(): React.FunctionComponentElement<{}> {
  return <section className="y-content x-gutters"></section>;
}

export default AuthenticatedRoute(Lobby);
