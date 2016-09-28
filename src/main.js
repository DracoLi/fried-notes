import React from 'react';
import ReactDOM from 'react-dom';
import loglevel from 'loglevel';
import Document from './app/document';
import './main.scss';

loglevel.setLevel('trace');
ReactDOM.render(
  <Document />,
  document.getElementById('documentContainer')
);
