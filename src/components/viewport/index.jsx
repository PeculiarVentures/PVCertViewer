import React from 'react';
import PropTypes from 'prop-types';
import { IntlWrapper } from 'lib-pintl';
import { ThemeProvider } from 'lib-react-components';
import theme from 'lib-react-components/lib/themes/default.css';

const Viewport = props => (
  <IntlWrapper
    messages={props.lang}
  >
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  </IntlWrapper>
);

Viewport.propTypes = {
  lang: PropTypes.oneOfType([
    PropTypes.object,
  ]),
  children: PropTypes.node,
};

Viewport.defaultProps = {
  lang: {},
  children: null,
};

export default Viewport;
