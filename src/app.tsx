import React, { useEffect, useState } from 'react';  
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from 'react-dom';
import debug from 'debug';
import { fromNullable } from '@krumpled/krumi/std/option';
import Header from '@krumpled/krumi/components/application-header';
import Footer from '@krumpled/krumi/components/application-footer';

const log = debug('krumi:app');

function App(): React.FunctionComponentElement<{}> {
  const [initial, update] = useState({});

  useEffect(function() {
    log('hello world');
  });

  return (
    <Router>
      <Footer key="footer" />
      <Header key="header" />
    </Router>
  );
}

function run(): void {
  render(<App />, document.getElementById('main'));
}

export default run;
