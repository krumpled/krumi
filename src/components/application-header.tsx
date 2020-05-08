import React from 'react';
import debug from 'debug';

const log = debug('krumi:application-header');

function header(): React.FunctionComponentElement<{}> {
  log('rendering header');
  return (<header></header>);
}

export default header;
