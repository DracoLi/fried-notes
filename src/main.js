import Document from './app/document';
import React from 'react'
import ReactDOM from 'react-dom'
import loglevel from 'loglevel';
import './main.scss';

loglevel.setLevel('trace');
ReactDOM.render(
  <Document />,
  document.getElementById('documentContainer')
);
