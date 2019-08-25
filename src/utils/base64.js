// Base64 JavaScript decoder
// Based on https://github.com/lapo-luchini/asn1js/blob/master/base64.js

const Base64 = {
  decoder: undefined,
  haveU8: ('Uint8Array' in (typeof window === 'object' ? window : global)),
  re: /-----BEGIN [^-]+-----([A-Za-z0-9+\/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/,
  unarmor: (a) => {
    const m = Base64.re.exec(a);

    if (m) {
      if (m[1]) {
        a = m[1];
      } else if (m[2]) {
        a = m[2];
      } else {
        throw 'RegExp out of sync';
      }
    }

    return Base64.decode(a);
  },

  pretty: (str) => {
    // fix padding
    if (str.length % 4 > 0) {
      str = `${str}===`.slice(0, str.length + str.length % 4);
    }
    // convert RFC 3548 to standard Base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // 80 column width
    return str.replace(/(.{80})/g, '$1\n');
  },

  decode: (a) => {
    let i;

    if (Base64.decoder === undefined) {
      const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const ignore = '= \f\n\r\t\u00A0\u2028\u2029';

      Base64.decoder = [];

      for (i = 0; i < 64; ++i) {
        Base64.decoder[b64.charAt(i)] = i;
      }

      for (i = 0; i < ignore.length; ++i) {
        Base64.decoder[ignore.charAt(i)] = -1;
      }

      // RFC 3548 URL & file safe encoding
      Base64.decoder['-'] = Base64.decoder['+'];
      Base64.decoder._ = Base64.decoder['/'];
    }

    let out = Base64.haveU8 ? new Uint8Array(a.length * 3 >> 2) : [];
    let bits = 0;
    let charCount = 0;
    let len = 0;

    for (i = 0; i < a.length; ++i) {
      let c = a.charAt(i);

      if (c === '=') {
        break;
      }

      c = Base64.decoder[c];

      if (c === -1) {
        continue;
      }

      if (c === undefined) {
        throw `Illegal character at offset ${i}`;
      }

      bits |= c;

      if (++charCount >= 4) {
        out[len++] = (bits >> 16);
        out[len++] = (bits >> 8) & 0xFF;
        out[len++] = bits & 0xFF;
        bits = 0;
        charCount = 0;
      } else {
        bits <<= 6;
      }
    }

    switch (charCount) {
      case 1:
        throw 'Base64 encoding incomplete: at least 2 bits missing';

      case 2:
        out[len++] = (bits >> 10);

        break;

      case 3:
        out[len++] = (bits >> 16);
        out[len++] = (bits >> 8) & 0xFF;

        break;

      default:
        break;
    }

    // in case it was originally longer because of ignored characters
    if (Base64.haveU8 && out.length > len) {
      out = out.subarray(0, len);
    }

    return out;
  },
};

export default Base64;
