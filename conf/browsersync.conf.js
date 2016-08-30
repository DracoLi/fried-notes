const conf = require('./gulp.conf');

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const webpackConf = require('./webpack.conf');
const webpackBundler = webpack(webpackConf);

module.exports = function () {
  return {
    server: {
      baseDir: [
        conf.paths.tmp,
        conf.paths.src
      ],
      middleware: [
        webpackDevMiddleware(webpackBundler, {
          // IMPORTANT: dev middleware can't access config, so we should
          // provide publicPath by ourselves
          publicPath: webpackConf.output.publicPath,

          // Quiet verbose output in console
          quiet: true
        })
      ]
    },
    open: false
  };
};
