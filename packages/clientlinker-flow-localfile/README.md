Clientlinker-flow-localfile
========================

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![NPM License][license-image]][npm-url]
[![Install Size][install-size-image]][install-size-url]


# Install

Install `clientlinker` pkg

```shell
npm i clientlinker --save
```

Install flow pkg

```shell
npm i clientlinker-flow-localfile --save
```


# Useage

```javascript
var clientlinker = require('clientlinker');
var linker = clientlinker({
  flows: ['localfile'],
  clients: {
    client: {
      localfile: __dirname+'/test/localfile/client/'
    }
  }
});

linker.flow('localfile', require('clientlinker-flow-localfile'));

// use
linker.run('client.js', null, {id: 13})
  .then(function(){});
```


[npm-image]: http://img.shields.io/npm/v/clientlinker-flow-localfile.svg
[downloads-image]: http://img.shields.io/npm/dm/clientlinker-flow-localfile.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-localfile
[travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker-flow-localfile/master.svg?label=linux
[travis-url]: https://travis-ci.org/Bacra/node-clientlinker-flow-localfile
[coveralls-image]: https://img.shields.io/coveralls/Bacra/node-clientlinker-flow-localfile.svg
[coveralls-url]: https://coveralls.io/github/Bacra/node-clientlinker-flow-localfile
[license-image]: http://img.shields.io/npm/l/clientlinker-flow-localfile.svg
[install-size-url]: https://packagephobia.now.sh/result?p=clientlinker-flow-localfile
[install-size-image]: https://packagephobia.now.sh/badge?p=clientlinker-flow-localfile
