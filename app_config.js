export default {
  version: 0.2,
  languages: ['en'],
  defaultLanguage: 'en',
  forceHTTPS: false,
  shells: [
    'index',
    'main',
  ],
  endpoints: {
    '*': 'main',
  },
  source: [{
    name: 'bootstrap',
    path: './bootstrap.js',
  }],
  resources: {
    backend: () => import(/* webpackChunkName: "backend" */'./src/backend.js'),
    container: name => import(/* webpackChunkName: "container-[request]" */`./src/containers/${name}/index.jsx`),
    shell: name => import(/* webpackChunkName: "shells-[request]" */`./src/shells/${name}/manifest.js`),
    lang: (lang, name) => import(/* webpackChunkName: "lang-[request]" */`./src/assets/langs/${lang}/${name}`),
    script: (shell, name) => import(/* webpackChunkName: "shells-[request]" */`./src/shells/${shell}/scripts/${name}`),
  },
};
