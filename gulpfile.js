let args = require('yargs').argv;
let buffer = require('vinyl-buffer');
let chmod = require('gulp-chmod');
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

let tsconfig = require('./tsconfig.json').compilerOptions;

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

gulp.task('build', ['typescript', 'protocolBuffers'], function() {
  return gulp.src('build/mbexport.js')
    .pipe(chmod(0o755))
    .pipe(rename('mbexport-rd'))
    .pipe(gulp.dest('build'));
});

module.exports = gulp;