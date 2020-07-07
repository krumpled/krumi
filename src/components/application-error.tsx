import React from 'react';
import { Link } from 'react-router-dom';

export type Props = {
  errors?: Array<Error>;
};

function ApplicationError(props: Props): React.FunctionComponentElement<Props> {
  return (
    <section data-role="applicaiton-error" className="flex items-center py-5 px-10">
      <p>
        <span>Something went wrong. </span>
        <Link to="/home">Return home.</Link>
        <input type="hidden" value={props.errors?.map((error) => error.message).join('\n')} />
      </p>
    </section>
  );
}

export default ApplicationError;
