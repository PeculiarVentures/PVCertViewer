import React, { Component } from 'react';
import Button from 'lib-react-components/commonjs/components/button';
import TextField from 'lib-react-components/commonjs/components/text_field';
import { Convert } from 'pvtsutils';
import Viewer from '../../components/viewer';
import CertHelper from '../../utils/cert_helper';
import query from '../../utils/query';
import Hex from '../../utils/hex';
import Base64 from '../../utils/base64';
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
    } else {
      this.certFromQuery = defaultCert;
    }
  }

  componentDidMount() {
    this.onHandleClick();
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

  onDrop = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    this.fileReaderHandler(file);
  }

  fileReaderHandler(file) {
    if (!file) {
      return false;
    }

    if (!/.(csr|cer|req|crt|pem)$/.test(file.name)) {
      alert('Not supported file format!');

      return false;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.error) {
        alert(`Your browser couldn't read the specified file (error code ${reader.error.code}).`);
      } else {
        this.decodeBinaryString(reader.result);
      }
    };
    reader.readAsBinaryString(file);

    return false;
  }

  decodeBinaryString(str) { // eslint-disable-line
    let value = str;

    try {
      if (!(Hex.re.test(str) || Base64.re.test(str))) {
        value = Convert.FromBinary(str);
      }

      const decoded = CertHelper.decodeCert(value);

      if (!decoded) {
        alert('Certificate decode error');
        return false;
      }

      return this.setState({
        decoded,
      });
    } catch (e) {
      console.log(e);

      alert('Cannot decode file.');
    }
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
          onDrop={this.onDrop}
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
