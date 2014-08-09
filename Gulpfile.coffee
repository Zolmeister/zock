gulp = require 'gulp'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
coffeelint = require 'gulp-coffeelint'

gulp.task 'lint', ->
  gulp.src './zock.coffee'
    .pipe coffeelint()
    .pipe coffeelint.reporter()

gulp.task 'build', ['lint'], ->
  browserify
    entries: './zock.coffee'
    extensions: ['.coffee']
    debug: true
    standalone: 'Zock'
  .bundle()
  .pipe source 'zock.js'
  .pipe gulp.dest '.'
