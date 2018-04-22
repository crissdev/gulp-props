# gulp-props

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm version](https://badge.fury.io/js/gulp-props.svg)](http://badge.fury.io/js/gulp-props)
[![Build Status](https://travis-ci.org/crissdev/gulp-props.svg?branch=master)](https://travis-ci.org/crissdev/gulp-props)
[![Build status](https://ci.appveyor.com/api/projects/status/7qnfbed3lts8xgvp/branch/master?svg=true&passingText=master%20-%20OK)](https://ci.appveyor.com/project/crissdev/gulp-props/branch/master)
[![Dependency Status](https://david-dm.org/crissdev/gulp-props.svg)](https://david-dm.org/crissdev/gulp-props)

> A [Gulp](https://github.com/gulpjs/gulp) plugin to convert [Java .properties](http://en.wikipedia.org/wiki/.properties) to [JSON](http://en.wikipedia.org/wiki/JSON)


## Install

```sh
npm install --save-dev gulp-props
```

## Usage

```js
const props = require('gulp-props');

// Generate a .js file with default namespace (config)
gulp.src('./src/*.properties')
  .pipe(props())
  .pipe(gulp.dest('./dist/'))

// Generate a .json file indented with 2 spaces
gulp.src('./src/*.properties')
  .pipe(props({ namespace: '', space: 2 }))
  .pipe(gulp.dest('./dist/'))

// Generate a .js file with a custom namespace (state)
gulp.src('./src/*.properties')
  .pipe(props({ namespace: 'state' }))
  .pipe(gulp.dest('./dist/'))
```


## API

### props([options])


#### options.namespace

Type: `String`

Default: `config`

The namespace to use when defining properties. Javascript reserved words cannot be used here.
Invalid identifiers will be adjusted to be valid, and a warning will be printed in the console.

**Note**: To force a `JSON` output set this option to an empty string.


#### options.space

Type: `Number` or `String`

Default: `null`

Control spacing in the resulting output. It has the same usage as for [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

_The option is used only when namespace option is an empty string._


#### options.replacer

Type: `Function` or `Array`

Default: `null`

Further transform the resulting output. It has the same usage as for [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

_The option is used only when namespace option is an empty string._


#### options.appendExt

Type: `Boolean`

Default: `false`

Append the extension (`.js` or `.json`) instead of replacing it.

Useful if the property file doesn't have an extension.

## License

MIT © [Cristian Trifan](https://crissdev.com)
