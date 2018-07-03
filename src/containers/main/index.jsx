import React, { Component } from 'react';
import { TextField, Button } from 'lib-react-components';
import Viewer from '../../components/viewer';
import CertHelper from '../../utils/cert_helper';

export default class MainContainer extends Component {
  state = {
    decoded: null,
  };

  onHandleClick = () => {
    const { inputNode } = this.inputNode;
    const source = inputNode.getValue();
    const decoded = CertHelper.decodeCert(source);

    if (!decoded) {
      alert('Certificate decode error');
      return false;
    }

    return this.setState({
      decoded,
    });
  }

  render() {
    const { decoded } = this.state;

    return (
      <div
        style={{
          padding: 40,
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <TextField
          multiLine
          placeholder="Cerificate raw"
          bgType="stroke"
          ref={(node) => { this.inputNode = node; }}
        />
        <Button
          onClick={this.onHandleClick}
          style={{
            marginTop: 24,
          }}
        >
          Decode
        </Button>
        {decoded && (
          <Viewer
            source={decoded}
          />
        )}
      </div>
    );
  }
}
