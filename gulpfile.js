/**
 * Created by zeb on 12/10/15.
 */
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var files = ['node_modules/es6-promise/dist/es6-promise.auto.js', 'src/index.js', 'src/assert.js'];

gulp.task('build', function () {
  return gulp.src(files)
    .pipe(concat('jquip.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('.'));
});

gulp.task('build-debug', function () {
  return gulp.src(files)
    .pipe(concat('jquip.debug.js'))
    .pipe(gulp.dest('.'))
});

gulp.task('default', ['build', 'build-debug']);
