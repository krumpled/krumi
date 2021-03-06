import React from 'react';

function ApplicationLoading(): React.FunctionComponentElement<unknown> {
  return (
    <section data-role="application-loading" className="py-10 h-20 box-content text-center relative">
      <div className="spinner">
        <div className="blob top"></div>
        <div className="blob bottom"></div>
        <div className="blob left"></div>
        <div className="blob move-blob"></div>
      </div>
    </section>
  );
}

export default ApplicationLoading;
