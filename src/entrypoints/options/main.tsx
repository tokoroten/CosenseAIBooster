import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/index.css';
import AppContainer from '../../components/AppContainer';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);
