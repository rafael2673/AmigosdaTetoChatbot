import React from 'react';
import IframeComponent from './components/Iframe/Iframe';
import Skybot from './components/Skybot';

import './App.css';

function App() {
  return (
    <div>
      <IframeComponent src="https://www.techo.org/brasil/" />
      <Skybot/>
    </div>
  );
}

export default App;
