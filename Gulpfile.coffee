_ = require 'lodash'
gulp = require 'gulp'
mocha = require 'gulp-mocha'
KarmaServer = require('karma').Server
rename = require 'gulp-rename'
webpack = require 'webpack-stream'
istanbul = require 'gulp-coffee-istanbul'
coffeelint = require 'gulp-coffeelint'
clayLintConfig = require 'clay-coffeescript-style-guide'

paths =
  coffee: ['./src/**/*.coffee', './*.coffee', './test/**/*.coffee']
  cover: ['./src/**/*.coffee', './*.coffee']
  rootScripts: './src/index.coffee'
  rootTests: './test/index.coffee'
  build: './build'
  output:
    tests: 'tests.js'

karmaConf =
  frameworks: ['mocha']
  client:
    useIframe: true
    captureConsole: true
    mocha:
      timeout: 300
  files: [
    "#{paths.build}/#{paths.output.tests}"
  ]
  browsers: ['Chrome', 'Firefox']

gulp.task 'test', ['lint', 'test:browser', 'test:coverage']

gulp.task 'watch', ->
  gulp.watch paths.coffee, ['test:node']
gulp.task 'watch:phantom', ->
  gulp.watch paths.coffee, ['test:browser:phantom']

gulp.task 'lint', ->
  gulp.src paths.coffee
    .pipe coffeelint(null, clayLintConfig)
    .pipe coffeelint.reporter()

gulp.task 'test:browser', ['build:test'], (cb) ->
  new KarmaServer(_.defaults(singleRun: true, karmaConf), cb).start()

gulp.task 'test:browser:phantom', ['build:test'], (cb) ->
  new KarmaServer(_.defaults({
    singleRun: true,
    browsers: ['PhantomJS']
  }, karmaConf), cb).start()

gulp.task 'test:node', ->
  gulp.src paths.rootTests
    .pipe mocha()

gulp.task 'test:coverage', ->
  gulp.src paths.cover
    .pipe istanbul includeUntested: false
    .pipe istanbul.hookRequire()
    .on 'finish', ->
      gulp.src paths.rootTests
        .pipe mocha()
        .pipe istanbul.writeReports({
          reporters: ['html', 'text', 'text-summary']
        })

gulp.task 'build:test', ->
  gulp.src paths.rootTests
  .pipe webpack
    devtool: 'inline-source-map'
    module:
      exprContextRegExp: /$^/
      exprContextCritical: false
      loaders: [
        {test: /\.coffee$/, loader: 'coffee'}
        {test: /\.json$/, loader: 'json'}
      ]
    resolve:
      extensions: ['.coffee', '.js', '.json', '']
  .pipe rename paths.output.tests
  .pipe gulp.dest paths.build
