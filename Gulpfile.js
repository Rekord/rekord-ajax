'use strict';

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var plugins = require('gulp-load-plugins')();
var gutil = require('gulp-util');
var qunit = require('gulp-qunit');
var shell = require('gulp-shell');
var size = require('gulp-check-filesize');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');

var build = {
  filename: 'rekord-ajax.js',
  minified: 'rekord-ajax.min.js',
  output: './build/',
  include: [
    './src/ajax.js'
  ]
};

var tests = [
  './test/index.html'
];

var executeMinifiedBuild = function(props)
{
  return function() {
    return gulp
      .src( props.output + props.filename )
      .pipe( rename( props.minified ) )
      .pipe( sourcemaps.init() )
        .pipe( plugins.uglify().on('error', gutil.log) )
      .pipe( sourcemaps.write('.') )
      .pipe( size({enableGzip: true}) )
      .pipe( gulp.dest( props.output ) )
    ;
  };
};

var executeBuild = function(props)
{
  return function() {
    return gulp
      .src( props.include )
      .pipe( plugins.concat( props.filename ) )
      .pipe( size({enableGzip: true}) )
      .pipe( gulp.dest( props.output ) )
      .pipe( jshint() )
      .pipe( jshint.reporter('default') )
      .pipe( jshint.reporter('fail') )
    ;
  };
};

var executeTest = function(file)
{
  return function() {
    return gulp
      .src( file )
      .pipe( qunit({'phantomjs-options': ['--web-security=no']}) )
    ;
  };
};

gulp.task('lint', function() {
  return gulp
    .src( build.output + build.filename )
    .pipe( jshint() )
    .pipe( jshint.reporter('default') )
    .pipe( jshint.reporter('fail') )
  ;
});

gulp.task( 'js', executeBuild( build ) );
gulp.task( 'js:min', ['js'], executeMinifiedBuild( build ) );

gulp.task( 'default', ['js:min']);

gulp.task( 'test', ['js'], executeTest( tests ) );