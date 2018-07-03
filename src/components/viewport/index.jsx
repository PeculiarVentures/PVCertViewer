import React from 'react';
import PropTypes from 'prop-types';
import { IntlWrapper } from 'pintl';

const Viewport = props => (
  <IntlWrapper
    messages={props.lang}
  >
    {props.children}
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
