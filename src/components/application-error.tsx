import React from 'react';
import { Link } from 'react-router-dom';
import debug from 'debug';

const log = debug('krumi:application-error');

export type Props = {
  errors?: Array<Error>;
};

function ApplicationError(props: Props): React.FunctionComponentElement<{}> {
  log('application-error - %o', props.errors);
  return (
    <section
      data-role="applicaiton-error"
      className="flex items-center py-5 px-10"
    >
      <p>
        <span>Something went wrong. </span>
        <Link to="/home">Return home.</Link>
      </p>
    </section>
  );
}

export default ApplicationError;
