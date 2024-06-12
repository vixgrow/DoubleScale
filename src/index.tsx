import React from 'react';
import ReactDOM from 'react-dom/client';
import Feature from './feature-module/feature';
import { BrowserRouter } from 'react-router-dom';
import { base_path } from './environment';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap/dist/js/bootstrap.bundle.js';
import '../src/style/css/feather.css'
import '../src/style/icon/tabler-icons/webfont/tabler-icons.css'
import '../src/index.scss'
import store from './core/data/redux/store';
import { Provider } from 'react-redux';

import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import '../src/style/icon/boxicons/boxicons/css/boxicons.min.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={base_path}>
        <Feature />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);


