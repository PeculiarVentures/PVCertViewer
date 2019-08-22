import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Typography } from 'lib-react-components';
import EarthIcon from '../../assets/svg/earth_icon';
import CancelIcon from '../../assets/svg/cancel_icon';
import AcceptIcon from '../../assets/svg/accept_icon';
import ExpandText from './expand_text';
import CertHelper from '../../utils/cert_helper';
import s from './styles/index.sass';

export default class Viewer extends Component {
  static propTypes = {
    source: PropTypes.oneOfType([
      PropTypes.object,
    ]),
  };

  static contextTypes = {
    intl: PropTypes.object,
    theme: PropTypes.object,
  };

  static defaultProps = {
    source: {},
  };

  static renderTitle(value) {
    return (
      <tr>
        <td
          colSpan="2"
          className={s.title_td}
        >
          <Typography
            type="h4"
            color="dark_grey"
          >
            {value}
          </Typography>
        </td>
      </tr>
    );
  }

  static renderInfoRow(name, value, props = {}) {
    const { monospace, ...other } = props;

    if (!value) {
      return null;
    }

    let valueParsed = value;

    if (Array.isArray(value)) {
      valueParsed = value.map((v, index) => ( // eslint-disable-next-line
        <Fragment key={`${name}-${index}`}>
          {v}
          <br />
        </Fragment>
      ));
    }

    return (
      <tr {...other}>
        <td>
          <Typography
            type="c1"
            color="grey"
          >
            {name}:
          </Typography>
        </td>
        <td style={{ fontFamily: monospace ? 'monospace' : 'inherit' }}>
          <Typography
            type="b3"
            color="black"
          >
            {valueParsed}
          </Typography>
        </td>
      </tr>
    );
  }

  static renderExtBasicConstraints(extension) {
    return Viewer.renderInfoRow('Value', Object.keys(extension.value).map(k => (
      <span>
        {k}: {extension.value[k].toString()}
      </span>
    )));
  }

  static renderExtExtendedKeyUsage(extension) {
    return Viewer.renderInfoRow('Value', extension.value.map(ku => (
      ku.name ? `${ku.name} (${ku.oid})` : ku.oid
    )).join(', '));
  }

  static renderExtAuthorityKeyIdentifier(extension) {
    const data = [];

    if (extension.value.keyIdentifier) {
      data.push(
        Viewer.renderInfoRow('Key ID', extension.value.keyIdentifier, {
          key: 1,
        }),
      );
    }

    if (extension.value.authorityCertSerialNumber) {
      data.push(
        Viewer.renderInfoRow('Authority Cert Serial Number', extension.value.authorityCertSerialNumber, {
          key: 2,
        }),
      );
    }

    return data;
  }

  static renderExtCertificatePolicies(extension) {
    return Viewer.renderInfoRow('Policies', extension.value.map((p) => {
      const hasLinkValue = p.value.filter(pl => pl.name === 'CPS');

      if (hasLinkValue.length) {
        return (
          <Fragment>
            <a
              href={hasLinkValue[0].value}
              target="_blank"
              rel="noopener noreferrer"
            >
              {p.name || p.oid}
            </a>
            {p.name ? ` (${p.oid})` : ''}
          </Fragment>
        );
      }

      return p.name ? `${p.name} (${p.oid})` : p.oid;
    }));
  }

  static renderExtCertificateAuthorityInformationAccess(extension) {
    return Viewer.renderInfoRow('Paths', extension.value.map(p => (
      <Fragment>
        {p.name ? `${p.name} (${p.oid}): ` : `${p.oid}: `}
        <a
          href={p.value.value}
          target="_blank"
          rel="noopener noreferrer"
        >
          {p.value.value}
        </a>
      </Fragment>
    )));
  }

  renderExtSAN(extension) {
    const { theme } = this.context;

    return Viewer.renderInfoRow('Value', extension.value.map((p) => {
      const {
        typeValue,
        subtreeName,
        type,
        value,
      } = p;
      const title = subtreeName ? `${subtreeName} ${type}` : type;
      let children = null;

      if (typeValue === 2 || typeValue === 7) {
        children = (
          <a
            href={`https://censys.io/ipv4?q=${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        );
      } else if (typeValue === 4) {
        children = value.map(v => (
          <span
            key={v.oid}
            style={{
              display: 'block',
            }}
          >
            {`${v.name}: ${v.value}`}
          </span>
        ));
      } else if (typeof value === 'string') {
        children = value;
      }

      return (
        <span
          style={{
            display: 'inline-block',
            paddingLeft: subtreeName ? 36 : 18,
            position: 'relative',
          }}
        >
          <span
            title={title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {subtreeName && (subtreeName === 'permitted' ? (
              <AcceptIcon
                className={classNames(
                  s.icon_subtree_type,
                  theme.fill_success,
                )}
              />
            ) : (
              <CancelIcon
                className={classNames(
                  s.icon_subtree_type,
                  theme.fill_wrong,
                )}
              />
            ))}
            <EarthIcon
              className={classNames(
                s.icon_san_type,
                theme.fill_black,
              )}
            />
          </span>
          {children}
        </span>
      );
    }));
  }

  static renderExtCRLDistributionPoints(extension) {
    return Viewer.renderInfoRow('Paths', extension.value.map(p => (
      <a
        href={p.value}
        target="_blank"
        rel="noopener noreferrer"
      >
        {p.value}
      </a>
    )));
  }

  static renderExtCertificateTransparency(extension) {
    return Viewer.renderInfoRow('Value', extension.value.map(t => (
      <span>
        {t.logName} ({t.timestamp})
      </span>
    )));
  }

  static renderExtensions(extensions, intl) {
    if (!extensions || !extensions.length) {
      return null;
    }

    return (
      <Fragment>
        {Viewer.renderTitle(intl.getText('Certificate.Part.Extensions'))}
        {extensions.map((extension, index) => {
          let extendedData = [];

          if (typeof extension.value === 'string') {
            extendedData = Viewer.renderInfoRow('Value', extension.value);
          }

          if (extension.value.length && Array.isArray(extension.value) && typeof extension.value[0] === 'string') {
            extendedData = Viewer.renderInfoRow('Value', extension.value.join(', '));
          }

          switch (extension.oid) {
            // Basic Constraints
            case '2.5.29.19':
              extendedData = Viewer.renderExtBasicConstraints(extension);
              break;
            // Extended Key Usage
            case '2.5.29.37':
              extendedData = Viewer.renderExtExtendedKeyUsage(extension);
              break;
            // Authority Key Identifier
            case '2.5.29.35':
              extendedData = Viewer.renderExtAuthorityKeyIdentifier(extension);
              break;
            // Certificate Policies
            case '2.5.29.32':
              extendedData = Viewer.renderExtCertificatePolicies(extension);
              break;
            // Certificate Authority Information Access
            case '1.3.6.1.5.5.7.1.1':
              extendedData = Viewer.renderExtCertificateAuthorityInformationAccess(extension);
              break;
            // Subject Alternative Name
            // Name Constraints
            case '2.5.29.17':
            case '2.5.29.30':
              extendedData = this.renderExtSAN(extension);
              break;
            // CRL Distribution Points
            case '2.5.29.31':
              extendedData = Viewer.renderExtCRLDistributionPoints(extension);
              break;
            // Certificate Transparency
            case '1.3.6.1.4.1.11129.2.4.2':
              extendedData = Viewer.renderExtCertificateTransparency(extension);
              break;

            default:
              break;
          }

          return ( // eslint-disable-next-line
            <Fragment key={index}>
              {Viewer.renderInfoRow('Name', extension.name ? `${extension.name} (${extension.oid})` : extension.oid)}
              {Viewer.renderInfoRow('Critical', extension.critical ? 'Yes' : 'No')}
              {extendedData}
              <tr className={s.empty_tr} />
            </Fragment>
          );
        })}
      </Fragment>
    );
  }

  static prepareAttributeValue(value) {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.map(v => Viewer.prepareAttributeValue(v));
    }

    if (typeof value === 'object') {
      if (value.oid && value.value) {
        return value;
      }

      return JSON.stringify(value);
    }

    return value;
  }

  static renderAttributes(attributes, intl) {
    if (!attributes || !attributes.length) {
      return null;
    }

    return (
      <Fragment>
        {Viewer.renderTitle(intl.getText('Certificate.Part.Attributes'))}
        {attributes.map((attribute, index) => {
          let extendedData = null;

          if (typeof attribute.value === 'string' || typeof attribute.value === 'number') {
            extendedData = Viewer.renderInfoRow(
              'Value',
              attribute.value,
            );
          }

          if (!extendedData) {
            switch (attribute.oid) {
              // Extension Request
              case '1.2.840.113549.1.9.14':
                extendedData = Viewer.renderInfoRow(
                  'Extensions',
                  Viewer.prepareAttributeValue(attribute.value).map(val => (
                    <Fragment>
                      {val.name ? `${val.name} (${val.oid})` : val.oid}
                      <br />
                      <span style={{ fontFamily: 'monospace' }}>
                        {val.value}
                      </span>
                      <br />
                    </Fragment>
                  )),
                );

                break;

              default:
                extendedData = Viewer.renderInfoRow(
                  'Value',
                  Viewer.prepareAttributeValue(attribute.value),
                );
            }
          }

          return ( // eslint-disable-next-line
            <Fragment key={index}>
              {Viewer.renderInfoRow('Name', attribute.name ? `${attribute.name} (${attribute.oid})` : attribute.oid)}
              {extendedData}
              <tr className={s.empty_tr} />
            </Fragment>
          );
        })}
      </Fragment>
    );
  }

  render() {
    const { source } = this.props;
    const { intl } = this.context;

    if (!source) {
      return null;
    }

    return (
      <Fragment>
        <table className={s.table}>
          <tbody>
            {Viewer.renderTitle(intl.getText('Certificate.Part.Basic'))}
            {Viewer.renderInfoRow('Subject DN', source.subject.map(sbj => `/${sbj.name}=${sbj.value}`).join(''))}
            {Viewer.renderInfoRow('Issuer DN', source.issuer.map(iss => `/${iss.name}=${iss.value}`).join(''))}
            {Viewer.renderInfoRow('Serial Number', source.serialNumber)}
            {Viewer.renderInfoRow('Version', source.version)}
            {Viewer.renderInfoRow('Issued', source.notBefore)}
            {Viewer.renderInfoRow('Expired', source.notAfter)}
            {Viewer.renderInfoRow('Validity', `${source.validity} days`)}

            {Viewer.renderTitle(intl.getText('Certificate.Part.PublicKey'))}
            {Viewer.renderInfoRow('Algorithm', source.publicKey.algorithm.name)}
            {Viewer.renderInfoRow('Modulus Bits', source.publicKey.algorithm.modulusBits)}
            {Viewer.renderInfoRow('Public Exponent', source.publicKey.algorithm.publicExponent)}
            {Viewer.renderInfoRow('Named Curve', source.publicKey.algorithm.namedCurve)}
            {Viewer.renderInfoRow(
              'Value',
              <ExpandText>
                {CertHelper.addSeparatorAfterSecondCharset(source.publicKey.value, ':')}
              </ExpandText>,
              { monospace: true },
            )}

            {Viewer.renderTitle(intl.getText('Certificate.Part.Signature'))}
            {Viewer.renderInfoRow('Algorithm', source.signature.algorithm ? source.signature.algorithm.name : '')}
            {Viewer.renderInfoRow('Hash', source.signature.algorithm ? source.signature.algorithm.hash : '')}
            {Viewer.renderInfoRow(
              'Value',
              <ExpandText>
                {CertHelper.addSeparatorAfterSecondCharset(source.signature.value, ':')}
              </ExpandText>,
              { monospace: true },
            )}

            {Viewer.renderExtensions(source.extensions, intl)}
            {Viewer.renderAttributes(source.attributes, intl)}
          </tbody>
        </table>
      </Fragment>
    );
  }
}
