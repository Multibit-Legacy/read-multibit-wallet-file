/*
 * Copyright (C) 2015-2016 KeepKey, LLC
 * All Rights Reserved
 */

let args = require('yargs').argv;
let browserify = require('browserify');
let buffer = require('vinyl-buffer');
let del = require('del');
let gulp = require('gulp');
let gulpif = require('gulp-if');
let pbjs = require('gulp-pbjs');
let source = require('vinyl-source-stream');
let rename = require('gulp-rename');
let replace = require('gulp-replace');
let proto2ts = require('proto2typescript');
let through = require('through2');
let ts = require('gulp-typescript');
let uglify = require('gulp-uglify');
let zip = require('gulp-zip');

let tsconfig = require('./tsconfig.json').compilerOptions;

let versionedFiles = ['src/mbexport.ts', 'package.json'];
let environment = args.environment || 'local';

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
      let protoJson = JSON.parse(file.contents);
      protoJson.package = 'MultibitWallet';
      let result = proto2ts(JSON.stringify(protoJson), {
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

gulp.task('typescript', ['wallet.d.ts'], function () {
  return gulp.src(['src/**/*.ts', '!src/**/*.spec.ts'])
    .pipe(ts(tsconfig))
    .pipe(gulp.dest('build'));
});

gulp.task('browserify', ['typescript', 'protocolBuffers'], function () {
  return browserify('./build/mbexport.js', {
    noParse: ['aes-js']
  })
    .bundle()
    .pipe(source('mbexport.js'))
    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
    .pipe(gulpif(environment !== 'local', uglify({
      preserveComments: "license"
    })))
    .pipe(gulp.dest('dist'));
});


gulp.task('cli', function() {

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

gulp.task('build', ['browserify']);

module.exports = gulp;