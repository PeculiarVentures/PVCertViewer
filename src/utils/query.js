function parse(path) {
  const result = {};

  if (path) {
    const params = path.split('?').map(str => window.decodeURIComponent(str));

    if (params.length === 2) {
      params[1].split('&').map((item) => {
        let parts = item.split('=');
        const key = parts.shift();

        parts = [key, parts.join('=')];

        if (parts[0] in result) {
          if (typeof result[parts[0]] === 'object' && Array.isArray([])) {
            result[parts[0]].push(parts[1]);
          } else {
            result[parts[0]] = [result[parts[0]]];
            result[parts[0]].push(parts[1]);
          }
        } else {
          result[parts[0]] = parts[1];
        }
        return true;
      });
    }
  }

  return result;
}

function stringify(obj) {
  const query = Object.keys(obj)
    .filter(key => obj[key] !== '' && obj[key] !== null)
    .map(key => `${key}=${obj[key]}`)
    .join('&');

  return query.length > 0 ? `?${query}` : '';
}

export default {
  parse,
  stringify,
};
