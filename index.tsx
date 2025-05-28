/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import App from '@/App';
import React from 'react';
import ReactDOM from 'react-dom/client';

// DataProvider and DataContext are removed as examples.json is no longer used.
// State will be managed within App.tsx or passed directly as props.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
