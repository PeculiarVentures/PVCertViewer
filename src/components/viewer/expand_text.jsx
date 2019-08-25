import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from 'lib-react-components/commonjs/components/button';
import ArrowRightIcon from '../../assets/svg/arrow_right';
import s from './styles/expand_text.sass';

export default class ExpandText extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  state = {
    open: false,
  }

  render() {
    const { children } = this.props;
    const { open } = this.state;

    return (
      <Fragment>
        <span
          className={classNames(
            s.text,
            {
              [s.open]: open,
            },
          )}
        >
          {children}
        </span>
        <Button
          className={classNames(
            s.button,
            {
              [s.open]: open,
            },
          )}
          size="small"
          onClick={() => this.setState({ open: !open })}
        >
          <ArrowRightIcon
            className={classNames(
              s.icon,
              'fill_white',
            )}
          />
        </Button>
      </Fragment>
    );
  }
}
