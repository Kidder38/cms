import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MinimalApp from './MinimalApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MinimalApp />
  </React.StrictMode>
);