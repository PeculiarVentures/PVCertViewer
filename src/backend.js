import React from 'react';
import { render } from 'react-dom';
import Viewport from './components/viewport/index';

let app = null; // eslint-disable-line

const dispatch = () => {};

const renderToRoot = (component, lang) => {
  render(React.createElement(
    Viewport,
    { lang },
    React.createElement(component),
  ), document.getElementById('root'));
};

const renderModal = (component, lang) => {
  console.warn('Unimplemented', component, lang);
};

const delegateAppController = (appController) => {
  app = appController;
};

export {
  delegateAppController,
  renderToRoot,
  renderModal,
  dispatch,
};
