export default (app, props) => { // eslint-disable-line
  return Promise.resolve()
    .then(() => Promise.all([
      app.mountTemplate('main', 'loading'),
      app.mountLang('main', 'en'),
    ]))
    .then(() => { // eslint-disable-line
      return app.mountContainer('main', {
        type: 'INIT:FROM_SHELL',
      }).then(() => app.unmountStyle('main', 'loading'));
    })
    .catch(err => (
      Promise.reject(err)
    ));
};
