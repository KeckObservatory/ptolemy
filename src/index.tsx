import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import reportWebVitals from './reportWebVitals';
import { Router, Route } from 'react-router';
import { createBrowserHistory } from 'history';
import { QueryParamProvider } from 'use-query-params';

const history = createBrowserHistory();

ReactDOM.render(
  <div>
  <Router {...{ history }}>
    <QueryParamProvider ReactRouterRoute={Route}>
      <App />
    </QueryParamProvider>
  </Router>,
</div>,
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,

  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
