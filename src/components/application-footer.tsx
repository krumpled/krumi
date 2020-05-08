import React from "react";
import debug from "debug";

const log = debug("krumi:application-footer");

function footer(): React.FunctionComponentElement<{}> {
  log("rendering footer");
  return <footer></footer>;
}

export default footer;
