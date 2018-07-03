import React, { Component } from 'react';
import { TextField, Button } from 'lib-react-components';
import Viewer from '../../components/viewer';
import CertHelper from '../../utils/cert_helper';
import query from '../../utils/query';
import defaultCert from '../../constants/default_cert';

export default class MainContainer extends Component {
  state = {
    decoded: null,
  };

  componentWillMount() {
    const { search } = window.location;
    const parsedQuery = query.parse(search);

    if (parsedQuery.cert) {
      this.certFromQuery = parsedQuery.cert;
    }
  }

  componentDidMount() {
    const { certFromQuery } = this;

    if (certFromQuery) {
      const decoded = CertHelper.decodeCert(certFromQuery);

      if (!decoded) {
        alert('Certificate decode error');
        return false;
      }

      this.setState({ // eslint-disable-line
        decoded,
      });
    }

    return false;
  }

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

  certFromQuery = null;

  render() {
    const { decoded } = this.state;
    const { certFromQuery } = this;

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
          defaultValue={certFromQuery || defaultCert}
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
