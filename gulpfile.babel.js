import gulp from 'gulp';
import HubRegistry from 'gulp-hub';
import browserSync from 'browser-sync';

import { path as configPath } from './conf/gulp.conf';

// Load some files into the registry
const hub = new HubRegistry([configPath.tasks('*.js')]);

// Tell gulp to use the tasks just loaded
gulp.registry(hub);

gulp.task('build', gulp.series(gulp.parallel('other', 'webpack:dist')));
gulp.task('test', gulp.series('karma:single-run'));
gulp.task('test:auto', gulp.series('karma:auto-run'));
gulp.task('serve', gulp.series('clean', 'webpack:watch', 'watch', 'browsersync'));
gulp.task('serve:dist', gulp.series('default', 'browsersync:dist'));
gulp.task('default', gulp.series('clean', 'build'));
gulp.task('watch', watch);

function reloadBrowserSync(cb) {
  browserSync.reload();
  cb();
}

function watch(done) {
  gulp.watch(configPath.tmp('**/*.(html|js)'), reloadBrowserSync);
  done();
}
