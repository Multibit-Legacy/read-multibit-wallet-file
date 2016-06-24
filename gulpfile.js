/*
 * Copyright (C) 2015-2016 KeepKey, LLC
 * All Rights Reserved
 */

var args = require('yargs').argv;
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gulpTypings = require("gulp-typings");
var pbjs = require('gulp-pbjs');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var proto2ts = require('proto2typescript');
var through = require('through2');
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');

var versionedFiles = ['manifest.json', 'package.json'];
var environment = args.environment || 'local';

gulp.task('clean', function (cb) {
  del([
    'dist',
    '*.zip',
    'build',
    'bin',
    'vendor',
    'node_modules',
    'typings'
  ], cb);
});

gulp.task("installTypings", function(){
  return gulp.src("./typings.json")
    .pipe(gulpTypings()); //will install all typingsfiles in pipeline.
});

gulp.task('protocolBuffers', function () {
  return gulp.src('protocol-buffers/wallet.proto')
    .pipe(pbjs())
    .pipe(gulp.dest('build'));
});

gulp.task('wallet.json', ['protocolBuffers'], function () {
  return gulp.src('build/wallet.js')
    .pipe(replace(/^.*\{([\w\W\n\r]+)\}.*$/, '{$1}'))
    .pipe(rename('wallet.json'))
    .pipe(gulp.dest('build'));
});

gulp.task('wallet.d.ts', ['wallet.json'], function (cb) {
  return gulp.src('build/wallet.json')
    .pipe(through.obj(function (file, enc, cb) {
      var protoJson = JSON.parse(file.contents);
      protoJson.package = 'MultibitWallet';
      var result = proto2ts(JSON.stringify(protoJson), {
        camelCaseGetSet: true,
        properties: true,
        underscoreGetSet: false
      }, function(err, out) {
        file.contents = new Buffer(out);
        cb(err, file);
      });
    }))
    .pipe(replace(/delete/g, 'isDelete'))
    .pipe(rename('wallet.d.ts'))
    .pipe(gulp.dest('build'))
});

gulp.task('typescript', ['wallet.d.ts', 'installTypings'], function () {
  return gulp.src(['src/**/*.ts', '!src/**/*.spec.ts'])
    .pipe(ts({
      "target": "es5",
      "module": "commonjs",
      "declaration": false,
      "noImplicitAny": false,
      "removeComments": true,
      "noLib": false,
      "experimentalDecorators": true
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('browserify', ['typescript', 'protocolBuffers'], function () {
  return browserify('./build/classic.js', {
    noParse: ['aes-js']
  })
    .bundle()
    .pipe(source('classic.js'))
    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
    .pipe(gulpif(environment !== 'local', uglify({
      preserveComments: "license"
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('copyAssets', function () {
  return gulp.src('images/**/*')
    .pipe(gulp.dest('dist/images'));
});

gulp.task('bumpPatch', function () {
  return gulp.src(versionedFiles)
    .pipe(bump({type: 'patch'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bumpMinor', function () {
  return gulp.src(versionedFiles)
    .pipe(bump({type: 'minor'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bumpMajor', function () {
  return gulp.src(versionedFiles)
    .pipe(bump({type: 'major'}))
    .pipe(gulp.dest('./'));
});

gulp.task('copyManifest', function () {
  var environmentTag = (environment !== "prod") ?
  ' (' + environment + ')' : '';
  return gulp.src('manifest.json')
    .pipe(replace(/"name": "KeepKey Wallet Sweeper.*"/g, '"name": "KeepKey Wallet Sweeper' + environmentTag + '"'))
    .pipe(gulp.dest('dist'));
});

gulp.task('copyHtml', function () {
  return gulp.src('src/*.html')
    .pipe(gulp.dest('dist'));
});

gulp.task('copyBackground', ['typescript'], function() {
  return gulp.src('build/background.js')
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['browserify', 'copyAssets', 'copyManifest', 'copyHtml', 'copyBackground'], function () {
  return gulp.src('dist/**/*')
    .pipe(zip('keepkey-wallet-sweeper-' + environment + '.zip'))
    .pipe(gulp.dest('.'));
});

module.exports = gulp;