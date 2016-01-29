/**
 * Created by zeb on 12/10/15.
 */
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');

gulp.task('build', function() {
    return gulp.src(['dep/pyscript/src/core.js', 'dep/pyscript/src/*.js',
        'dep/pyscript/src/modules/*.js', '!dep/**/*.spec.js'])
        .pipe(concat('pyscript.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dep/pyscript'));
});

gulp.task('build-debug', function() {
    return gulp.src(['dep/pyscript/src/core.js', 'dep/pyscript/src/*.js',
        'dep/pyscript/src/modules/*.js', '!dep/**/*.spec.js'])
        .pipe(concat('pyscript.js'))
        .pipe(gulp.dest('dep/pyscript'))
});

gulp.task('default', ['build']);
