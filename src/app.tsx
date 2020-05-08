import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { render } from "react-dom";
import debug from "debug";
import Header from "@krumpled/krumi/components/application-header";
import Footer from "@krumpled/krumi/components/application-footer";
import config from "@krumpled/krumi/config";

const log = debug("krumi:app");

function App(): React.FunctionComponentElement<{}> {
  const [initial, update] = useState({ count: 0 });
  log("krumi-config: %j", config);

  useEffect(function () {
    log("application main effect - %o", initial);

    if (initial.count === 0) {
      update({ count: 1 });
    }
  });

  return (
    <Router>
      <Footer key="footer" />
      <Header key="header" />
    </Router>
  );
}

function run(): void {
  render(<App />, document.getElementById("main"));
}

export default run;
