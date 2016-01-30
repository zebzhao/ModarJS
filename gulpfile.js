/**
 * Created by zeb on 12/10/15.
 */
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

gulp.task('build', function() {
    return gulp.src(['src/core.js', 'src/*.js',
        'src/modules/*.js', '!**/*.spec.js'])
        .pipe(concat('pyscript.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('.'));
});

gulp.task('build-debug', function() {
    return gulp.src(['src/core.js', 'src/*.js',
        'src/modules/*.js', '!**/*.spec.js'])
        .pipe(concat('pyscript.debug.js'))
        .pipe(gulp.dest('.'))
});

gulp.task('default', ['build', 'build-debug']);
