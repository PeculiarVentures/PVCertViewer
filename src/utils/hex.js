// Hex JavaScript decoder
// Based on https://github.com/lapo-luchini/asn1js/blob/master/hex.js

const Hex = {
  decoder: undefined,
  haveU8: ('Uint8Array' in (typeof window === 'object' ? window : global)),
  re: /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/,
  decode: (a) => {
    let i;

    if (Hex.decoder === undefined) {
      let hex = '0123456789ABCDEF';
      const ignore = ' \f\n\r\t\u00A0\u2028\u2029';

      Hex.decoder = [];

      for (i = 0; i < 16; ++i) {
        Hex.decoder[hex.charAt(i)] = i;
      }

      hex = hex.toLowerCase();

      for (i = 10; i < 16; ++i) {
        Hex.decoder[hex.charAt(i)] = i;
      }

      for (i = 0; i < ignore.length; ++i) {
        Hex.decoder[ignore.charAt(i)] = -1;
      }
    }

    let out = Hex.haveU8 ? new Uint8Array(a.length >> 1) : [];
    let bits = 0;
    let charCount = 0;
    let len = 0;

    for (i = 0; i < a.length; ++i) {
      let c = a.charAt(i);

      if (c === '=') {
        break;
      }

      c = Hex.decoder[c];

      if (c === -1) {
        continue;
      }

      if (c === undefined) {
        throw `Illegal character at offset ${i}`;
      }

      bits |= c;

      if (++charCount >= 2) {
        out[len++] = bits;
        bits = 0;
        charCount = 0;
      } else {
        bits <<= 4;
      }
    }

    if (charCount) {
      throw 'Hex encoding incomplete: 4 bits missing';
    }

    // in case it was originally longer because of ignored characters
    if (Hex.haveU8 && out.length > len) {
      out = out.subarray(0, len);
    }

    return out;
  },
};

export default Hex;
