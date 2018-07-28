import React from 'react';
import { CircularProgress, ThemeProvider } from 'lib-react-components';
import theme from 'lib-react-components/lib/themes/default.css';

const RootShell = () => (
  <ThemeProvider theme={theme}>
    <CircularProgress />
  </ThemeProvider>
);

export default RootShell;
