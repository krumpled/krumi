import React from 'react';

function ApplicationLoading(): React.FunctionComponentElement<{}> {
  return (
    <section data-role="application-loading" className="py-10 text-center">
      <p className="my-10">Loading, please wait...</p>
    </section>
  );
}

export default ApplicationLoading;
