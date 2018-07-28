export default (app, props) => { // eslint-disable-line
  return Promise.resolve()
    .then(() => app.mountLang('main', 'en'))
    .then(() => { // eslint-disable-line
      return app.mountContainer('main', {
        type: 'INIT:FROM_SHELL',
      });
    })
    .catch(err => (
      Promise.reject(err)
    ));
};
