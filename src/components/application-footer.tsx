import React from 'react';
import debug from 'debug';
import { Session } from '@krumpled/krumi/session';

const log = debug('krumi:application-footer');

type Props = {
  session: Session;
};

function footer(props: Props): React.FunctionComponentElement<{}> {
  log('rendering footer, against session %o', props.session);
  return <footer></footer>;
}

export default footer;
