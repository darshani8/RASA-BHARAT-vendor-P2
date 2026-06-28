// Entry point: expose React 18 globally, then boot the Design-Component runtime, which renders the
// embedded <x-dc> template (the Zenith Retail Cloud design) into the page using React.createRoot.
import React from 'react';
import * as ReactDOMLegacy from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles.css';

// The dc-runtime expects window.React / window.ReactDOM (it normally loads them from a CDN, but
// skips that when they're already present). We bundle them locally so the app works fully offline.
declare global {
  interface Window {
    React: typeof React;
    ReactDOM: unknown;
  }
}
window.React = React;
window.ReactDOM = Object.assign({}, ReactDOMLegacy, { createRoot, hydrateRoot });

// Dynamic import (not static) so the globals above are set before the runtime self-boots.
void import('./dc-runtime.js');
