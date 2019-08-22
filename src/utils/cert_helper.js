import * as asn1js from 'asn1js';
import Certificate from 'pkijs/build/Certificate';
import CertificationRequest from 'pkijs/build/CertificationRequest';
import { Convert } from 'pvtsutils';
import moment from 'moment';
import OIDS from '../constants/oids';
import logList from '../constants/log_list.json';

// RegExp for base64
const base64RegExp = /([A-Za-z0-9+\/=\s]+)|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/; // eslint-disable-line

const flatten = arr => (
  arr.reduce(
    (flat, toFlatten) => flat.concat(
      Array.isArray(toFlatten)
        ? flatten(toFlatten)
        : toFlatten,
    ),
    [],
  )
);

// OIDs list for decode subject and issuer
const OID = {
  '2.5.4.3': {
    short: 'CN',
    long: 'Common Name',
  },
  '2.5.4.6': {
    short: 'C',
    long: 'Country',
  },
  '2.5.4.5': {
    short: 'serialNumber',
    long: 'Serial Number',
  },
  '0.9.2342.19200300.100.1.25': {
    short: 'DC',
    long: 'Domain Component',
  },
  '1.2.840.113549.1.9.1': {
    short: 'E',
    long: 'Email',
  },
  '2.5.4.42': {
    short: 'G',
    long: 'Given Name',
  },
  '2.5.4.43': {
    short: 'I',
    long: 'Initials',
  },
  '2.5.4.7': {
    short: 'L',
    long: 'Locality',
  },
  '2.5.4.10': {
    short: 'O',
    long: 'Organization',
  },
  '2.5.4.11': {
    short: 'OU',
    long: 'Organization Unit',
  },
  '2.5.4.8': {
    short: 'ST',
    long: 'State',
  },
  '2.5.4.9': {
    short: 'Street',
    long: 'Street Address',
  },
  '2.5.4.4': {
    short: 'SN',
    long: 'Surname',
  },
  '2.5.4.12': {
    short: 'T',
    long: 'Title',
  },
  '1.2.840.113549.1.9.8': {
    long: 'Unstructured Address',
  },
  '1.2.840.113549.1.9.2': {
    long: 'Unstructured Name',
  },
  '1.3.6.1.4.1.311.60.2.1.3': {
    short: 'jurisdictionCountry',
    long: 'Jurisdiction Country',
  },
  '2.5.4.15': {
    short: 'businessCategory',
    long: 'Business Category',
  },
  '1.3.6.1.2.1.1.5': {
    long: 'Host Name',
  },
};

// SAN types
const SANtypes = {
  0: 'Other Name',
  1: 'Email Address',
  2: 'DNS Name',
  3: 'X400 Address',
  4: 'Directory Name',
  5: 'Edi Party Name',
  6: 'Uniform Resource Identifier',
  7: 'IP Address',
  8: 'Registered ID',
};

const CertHelper = {
  Extensions: {
    keyUsage: function keyUsage(extension) {
      const usages = [];
      // parse key usage BitString
      const valueHex = new Uint8Array(Convert.FromHex(extension.parsedValue.valueBlock.valueHex));
      const unusedBits = extension.parsedValue.valueBlock.unusedBits;
      let keyUsageByte1 = valueHex[0];
      let keyUsageByte2 = valueHex.byteLength > 1 ? valueHex[1] : 0;

      if (valueHex.byteLength === 1) {
        keyUsageByte1 >>= unusedBits;
        keyUsageByte1 <<= unusedBits;
      }
      if (valueHex.byteLength === 2) {
        keyUsageByte2 >>= unusedBits;
        keyUsageByte2 <<= unusedBits;
      }
      if (keyUsageByte1 & 0x80) {
        usages.push('Digital Signature');
      }
      if (keyUsageByte1 & 0x40) {
        usages.push('Non Repudiation');
      }
      if (keyUsageByte1 & 0x20) {
        usages.push('Key Encipherment');
      }
      if (keyUsageByte1 & 0x10) {
        usages.push('Data Encipherment');
      }
      if (keyUsageByte1 & 0x08) {
        usages.push('Key Agreement');
      }
      if (keyUsageByte1 & 0x04) {
        usages.push('Key Cert Sign');
      }
      if (keyUsageByte1 & 0x02) {
        usages.push('cRL Sign');
      }
      if (keyUsageByte1 & 0x01) {
        usages.push('Encipher Only');
      }
      if (keyUsageByte2 & 0x80) {
        usages.push('Decipher Only');
      }

      return usages;
    },

    keyUsageAttr: function keyUsageAttr(hex, unusedBits) {
      const usages = [];
      // parse key usage BitString
      const valueHex = new Uint8Array(Convert.FromHex(hex));
      // const unusedBits = bits;
      let keyUsageByte1 = valueHex[0];
      let keyUsageByte2 = valueHex.byteLength > 1 ? valueHex[1] : 0;

      if (valueHex.byteLength === 1) {
        keyUsageByte1 >>= unusedBits;
        keyUsageByte1 <<= unusedBits;
      }
      if (valueHex.byteLength === 2) {
        keyUsageByte2 >>= unusedBits;
        keyUsageByte2 <<= unusedBits;
      }
      if (keyUsageByte1 & 0x80) {
        usages.push('Digital Signature');
      }
      if (keyUsageByte1 & 0x40) {
        usages.push('Non Repudiation');
      }
      if (keyUsageByte1 & 0x20) {
        usages.push('Key Encipherment');
      }
      if (keyUsageByte1 & 0x10) {
        usages.push('Data Encipherment');
      }
      if (keyUsageByte1 & 0x08) {
        usages.push('Key Agreement');
      }
      if (keyUsageByte1 & 0x04) {
        usages.push('Key Cert Sign');
      }
      if (keyUsageByte1 & 0x02) {
        usages.push('cRL Sign');
      }
      if (keyUsageByte1 & 0x01) {
        usages.push('Encipher Only');
      }
      if (keyUsageByte2 & 0x80) {
        usages.push('Decipher Only');
      }

      return usages;
    },

    netscapeCertType: function netscapeCertType(extension) {
      const usages = [];
      // parse key usage BitString
      const valueHex = Convert.FromHex(extension.extnValue.valueBlock.valueHex);
      const bitString = asn1js.fromBER(valueHex).result;
      const unusedBits = bitString.valueBlock.unusedBits;
      let byte = new Uint8Array(bitString.valueBlock.valueHex)[0];
      byte >>= unusedBits;
      byte <<= unusedBits;
      /**
       * bit-0 SSL client - this cert is certified for SSL client authentication use
       * bit-1 SSL server - this cert is certified for SSL server authentication use
       * bit-2 S/MIME - this cert is certified for use by clients (New in PR3)
       * bit-3 Object Signing - this cert is certified for signing objects such as Java
       * applets and plugins(New in PR3)
       * bit-4 Reserved - this bit is reserved for future use
       * bit-5 SSL CA - this cert is certified for issuing certs for SSL use
       * bit-6 S/MIME CA - this cert is certified for issuing certs for S/MIME use (New in PR3)
       * bit-7 Object Signing CA - this cert is certified for issuing
       * certs for Object Signing (New in PR3)
       */
      if (byte & 0x80) {
        usages.push('SSL client');
      }
      if (byte & 0x40) {
        usages.push('SSL server');
      }
      if (byte & 0x20) {
        usages.push('S/MIME');
      }
      if (byte & 0x10) {
        usages.push('Object Signing');
      }
      if (byte & 0x08) {
        usages.push('Reserved');
      }
      if (byte & 0x04) {
        usages.push('SSL CA');
      }
      if (byte & 0x02) {
        usages.push('S/MIME CA');
      }
      if (byte & 0x01) {
        usages.push('Object Signing CA');
      }

      return usages;
    },
  },

  /**
   * Decode CSR attribute value
   * @param {val} object
   * @returns {object|string}
   */
  decodeAttributeValue: function decodeAttributeValue(val) {
    if (!val) {
      return null;
    }

    if (
      val.blockName === 'IA5String'
      || val.blockName === 'ObjectIdentifier'
    ) {
      return {
        name: OIDS[val.valueBlock.value] || val.valueBlock.value,
        oid: val.valueBlock.value,
        value: undefined,
      };
    }

    if (val.blockName === 'Sequence') {
      let temp;

      if (val.valueBlock.value[0] && val.valueBlock.value[0].blockName === 'ObjectIdentifier') {
        temp = decodeAttributeValue(val.valueBlock.value[0]);

        const valueBlock = val.valueBlock.value.find(v => v.blockName === 'OctetString');

        if (valueBlock) {
          const attrValue = decodeAttributeValue(valueBlock);

          // Key Usage
          if (temp.oid === '2.5.29.15') {
            temp.value = CertHelper.Extensions.keyUsageAttr(
              attrValue,
              Number(attrValue),
            );
          } else {
            temp.value = attrValue;
          }
        }

        return temp;
      }

      return val.valueBlock.value.map(v => decodeAttributeValue(v));
    }

    if (val.blockName === 'Integer') {
      return val.valueBlock.valueDec;
    }

    if (
      val.blockName === 'Utf8String'
      || val.blockName === 'BmpString'
      || val.blockName === 'BitString'
      || val.blockName === 'OctetString'
    ) {
      return val.valueBlock.value.length
        ? val.valueBlock.value
        : val.valueBlock.valueHex;
    }

    if (val.blockName === 'Boolean') {
      return val.valueBlock.value;
    }

    return `need decode: ${val.blockName}`;
  },

  /**
   * Add space symbol after all second charset
   * @param {string} string
   * @returns {string}
   */
  addSeparatorAfterSecondCharset: function addSeparatorAfterSecondCharset(string, separator = ' ') {
    return string.replace(/(.{2})/g, `$1${separator}`).slice(0, -1);
  },

  /**
   * Decode algorithm OID
   * @param {{
   *   algorithmId: string
   * }} pkiAlg
   * @returns {{
   *   name: string
   *   hash: string
   * }}
   */
  prepareAlgorithm: function prepareAlgorithm(pkiAlg) {
    if (!pkiAlg) {
      return null;
    }

    switch (pkiAlg.algorithmId) {
      case '1.2.840.113549.1.1.5':
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-1',
        };

      case '1.2.840.113549.1.1.11':
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        };

      case '1.2.840.113549.1.1.12':
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-384',
        };

      case '1.2.840.113549.1.1.13':
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-512',
        };

      case '1.2.840.10045.4.3.2':
        return {
          name: 'ECDSA',
          hash: 'SHA-256',
        };

      case '1.2.840.10045.4.1':
        return {
          name: 'ECDSA',
          hash: 'SHA-1',
        };

      default:
        return {
          name: pkiAlg.algorithmId,
        };
    }
  },

  formatDer: function formatDer(string) {
    return `
-----BEGIN CERTIFICATE-----
${string.replace(/(.{64})/g, '$1 \n')}
-----END CERTIFICATE-----
    `;
  },

  deformatDer: function deformatDer(string) {
    return string.replace(/(.{32})/g, '$1 \n').replace(/(.{4})/g, '$1 ').trim();
  },

  toHexAndFormat: function toHexAndFormat(arrayBuffer) {
    return this.addSeparatorAfterSecondCharset(Convert.ToHex(arrayBuffer)).toUpperCase();
  },

  decodeIssuerSubject: function decodeIssuerSubject(obj) {
    if (!obj || !obj.typesAndValues) {
      return [];
    }

    return obj.typesAndValues.map(({ type, value }) => {
      const oid = OID[type.toString()];
      const name = typeof oid === 'object' ? oid.short : '';
      const nameLong = typeof oid === 'object' ? oid.long : '';

      return {
        name,
        nameLong,
        oid: type,
        value: value.valueBlock.value,
      };
    });
  },

  /**
   * Decode SANs list
   */
  decodeSANs: function decodeSAN(listSAN, dataForItem = {}) {
    return listSAN.map((an) => {
      const itemSAN = an.base || an;
      const item = {
        type: SANtypes[itemSAN.type] || `need handler for this type - ${itemSAN.type}`,
        typeValue: itemSAN.type,
        ...dataForItem,
      };

      switch (itemSAN.type) {
        case 4:
          item.value = itemSAN.value.typesAndValues.map(i => ({
            name: OIDS[i.type],
            oid: i.type,
            value: i.value.valueBlock.value,
          }));
          break;

        case 7:
          item.value = this.decodeIP(itemSAN.value.valueBlock.valueHex);
          break;

        default:
          item.value = typeof itemSAN.value === 'string' ? itemSAN.value : `type value is not a string - ${itemSAN.type}`;
      }

      return item;
    });
  },

  /**
   * Decode IP (format - 3E996CD8FFFFFFF8)
   */
  decodeIP: function decodeIP(string) {
    if (string.length === 64 && parseInt(string, 16) === 0) {
      return '::/0';
    }

    if (string.length !== 16) {
      return string;
    }

    const mask = parseInt(string.slice(8), 16)
      .toString(2)
      .split('')
      .reduce((a, k) => a + (+k), 0);
    let ip = string.slice(0, 8)
      .replace(/(.{2})/g, match => `${parseInt(match, 16)}.`);
    ip = ip.slice(0, -1);

    return `${ip}/${mask}`;
  },

  /**
   * Decode certificate source
   * @param {string} source
   * @returns {{
   *  issuer: array,
   *  subject: array,
   *  publicKey: object,
   *  signature: object,
   *  serialNumber: string,
   *  version: number,
   *  notBefore: string,
   *  notAfter: string,
   *  isCA: boolean,
   *  isRoot: boolean,
   *  sourceType: string,
   *  source: string,
   *  extensions: array,
   * }|boolean}
   */
  decodeCert: function decodeCert(source) {
    try {
      let sourceType;
      let value;

      // prepare source value to ArrayBuffer
      if (base64RegExp.test(source)) { // pem
        value = Convert.FromBinary(window.atob(source.replace(/(-----(BEGIN|END) CERTIFICATE( REQUEST|)-----|\r|\n)/g, '')));
        sourceType = 'pem';
      } else if (/[a-f\d]/ig.test(source)) { // hex
        value = Convert.FromHex(source.replace(/(\r|\n|\s)/g, ''));
        sourceType = 'hex';
      } else {
        value = Convert.FromBinary(source);
        sourceType = 'der';
      }

      // decode ArrayBuffer
      const asn1 = asn1js.fromBER(value);
      let certificate;

      try {
        certificate = new Certificate({ schema: asn1.result });
      } catch (err) {
        certificate = new CertificationRequest({ schema: asn1.result });
      }

      const certificateJson = certificate.toJSON();

      // decode issuer
      const issuer = this.decodeIssuerSubject(certificateJson.issuer);

      // decode subject
      const subject = this.decodeIssuerSubject(certificateJson.subject);

      // decode public key
      const publicKey = {
        algorithm: {
          name: certificate.subjectPublicKeyInfo.algorithm.algorithmId === '1.2.840.10045.2.1' ? 'EC' : 'RSA',
        },
        value: Convert.ToHex(certificate.subjectPublicKeyInfo.subjectPublicKey.valueBeforeDecode)
          .toLowerCase(),
        oid: certificate.subjectPublicKeyInfo.algorithm.algorithmId,
      };

      if (certificate.subjectPublicKeyInfo.parsedKey) {
        const { modulus, publicExponent } = certificate.subjectPublicKeyInfo.parsedKey;

        if (publicKey.algorithm.name === 'RSA') {
          publicKey.algorithm.modulusBits = modulus.valueBlock.valueHex.byteLength << 3;
          publicKey.algorithm.publicExponent = publicExponent.valueBlock.valueHex.byteLength === 3
            ? 65537
            : 3;
        } else if (publicKey.algorithm.name === 'EC') {
          publicKey.algorithm.namedCurve = certificateJson.subjectPublicKeyInfo.crv;
        }
      }

      // decode signature
      const signature = {
        algorithm: this.prepareAlgorithm(certificateJson.signatureAlgorithm),
        value: certificateJson.signatureValue.valueBlock.valueHex.toLowerCase(),
        oid: certificateJson.signatureAlgorithm.algorithmId,
      };

      // get serial number
      const serialNumber = certificateJson.serialNumber
        ? certificateJson.serialNumber.valueBlock.valueHex.toLowerCase()
        : null;

      // get version
      const version = certificateJson.version;

      // decode notBefore date
      const notBefore = certificateJson.notBefore && certificateJson.notBefore.value
        ? moment(certificateJson.notBefore.value).format('LLLL')
        : '';

      // decode notAfter date
      const notAfter = certificateJson.notAfter && certificateJson.notAfter.value
        ? moment(certificateJson.notAfter.value).format('LLLL')
        : '';

      // get days diff
      const validity = (
        certificateJson.notBefore
        && certificateJson.notBefore.value
        && certificateJson.notAfter
        && certificateJson.notAfter.value
      ) ? moment(certificateJson.notAfter.value).diff(certificateJson.notBefore.value, 'days')
        : 0;

      // get isRoot
      const isRoot = JSON.stringify(issuer) === JSON.stringify(subject);

      // get isCA
      let isCA = false;

      // decode extensions
      const extensions = [];

      if (certificateJson.extensions) {
        certificateJson.extensions.forEach((ext) => {
          const extension = {
            name: OIDS[ext.extnID] || ext.extnID,
            oid: ext.extnID,
            critical: ext.critical || false,
            value: [],
          };

          try {
            switch (ext.extnID) {
              // Name Constraints
              case '2.5.29.30': {
                extension.value = [
                  ...this.decodeSANs(ext.parsedValue.permittedSubtrees || [], {
                    subtreeName: 'permitted',
                  }),
                  ...this.decodeSANs(ext.parsedValue.excludedSubtrees || [], {
                    subtreeName: 'excluded',
                  }),
                ];
                break;
              }

              // Basic Constraints
              case '2.5.29.19':
                if (ext.parsedValue.cA) {
                  isCA = true;
                }

                extension.value = Object.assign({
                  cA: false,
                }, ext.parsedValue);
                break;

              // Key Usage
              case '2.5.29.15':
                extension.value = CertHelper.Extensions.keyUsage(ext);
                break;

              // Extended Key Usage
              case '2.5.29.37':
                extension.value = ext.parsedValue.keyPurposes.map(oid => ({
                  oid,
                  name: OIDS[oid],
                }));
                break;

              // CRL Distribution Points
              case '2.5.29.31':
                ext.parsedValue.distributionPoints.forEach((dp) => {
                  dp.distributionPoint.forEach((p) => {
                    extension.value.push({
                      value: p.value,
                      type: p.type,
                    });
                  });
                });
                break;

              // Subject Alternative Name
              case '2.5.29.17': {
                extension.value = this.decodeSANs(ext.parsedValue.altNames);
                break;
              }

              // Authority Key Identifier
              case '2.5.29.35':
                extension.value = {};
                if (ext.parsedValue.keyIdentifier) {
                  extension.value.keyIdentifier = ext
                    .parsedValue
                    .keyIdentifier
                    .valueBlock
                    .valueHex.toLowerCase();
                }
                if (ext.parsedValue.authorityCertSerialNumber) {
                  extension.value.authorityCertSerialNumber = ext
                    .parsedValue
                    .authorityCertSerialNumber
                    .valueBlock
                    .valueHex.toLowerCase();
                }
                if (ext.parsedValue.authorityCertIssuer) {
                  // TODO: need check this decoding
                  extension.value.authorityCertIssuer = ext.parsedValue.authorityCertIssuer;
                  // this.name2str(ext.parsedValue.authorityCertIssuer[0].value);
                }
                break;

              // Authority Info Access
              case '1.3.6.1.5.5.7.1.1':
                extension.value = ext.parsedValue.accessDescriptions.map(desc => ({
                  oid: desc.accessMethod,
                  name: OIDS[desc.accessMethod],
                  value: {
                    type: desc.accessLocation.type,
                    value: desc.accessLocation.value,
                  },
                }));
                break;

              // Netscape Certificate Type
              case '2.16.840.1.113730.1.1':
                extension.value = CertHelper.Extensions.netscapeCertType(ext);
                break;

              // Certificate Policies
              case '2.5.29.32':
                extension.value = ext.parsedValue.certificatePolicies.map(cp => ({
                  oid: cp.policyIdentifier,
                  name: OIDS[cp.policyIdentifier],
                  value: Array.isArray(cp.policyQualifiers)
                    ? cp.policyQualifiers.map(pq => ({
                      oid: pq.policyQualifierId,
                      name: OIDS[pq.policyQualifierId],
                      value: Array.isArray(pq.qualifier.valueBlock.value)
                        ? pq.qualifier.valueBlock.value.map(q => q.valueBlock.value)
                        : pq.qualifier.valueBlock.value,
                    }))
                    : [],
                }));
                break;

              // Certificate Transparency
              case '1.3.6.1.4.1.11129.2.4.2':
                extension.value = ext.parsedValue.timestamps.map((t) => {
                  const logName = logList.logs.filter(l => l.hex === t.logID.toLowerCase());

                  return {
                    logID: t.logID,
                    logName: logName.length > 0 ? logName[0].description : '',
                    timestamp: moment(t.timestamp).format('LLLL'),
                    signature: t.signature.valueBeforeDecode,
                    hashAlgorithm: t.hashAlgorithm,
                    signatureAlgorithm: t.signatureAlgorithm,
                  };
                });
                break;

              default:
                extension.value = ext.extnValue.valueBlock.valueHex.toLowerCase();
            }
          } catch (error) {
            console.error('Decode extension error:', error);
          }

          extensions.push(extension);
        });
      }

      // decode attributes
      const attributes = [];

      if (certificateJson.attributes) {
        certificateJson.attributes.forEach((attr) => {
          const attribute = {
            name: OIDS[attr.type] || attr.type,
            oid: attr.type,
            value: [],
          };

          try {
            attribute.value = flatten(attr.values.map(val => this.decodeAttributeValue(val)));
          } catch (error) {
            console.error('Decode attribute error:', error);
          }

          attributes.push(attribute);
        });
      }

      const parsed = {
        issuer,
        subject,
        publicKey,
        signature,
        serialNumber,
        version,
        notBefore,
        notAfter,
        validity,
        isCA,
        isRoot,
        sourceType,
        source,
        extensions,
        attributes,
      };

      return parsed;
    } catch (error) {
      console.error('Decode certificate error:', error);
      return false;
    }
  },
};

export default CertHelper;
