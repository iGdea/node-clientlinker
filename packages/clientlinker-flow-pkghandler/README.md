Clientlinker-flow-pkghandler
============================

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![NPM License][license-image]][npm-url]


# Install

Install `clientlinker` pkg

```shell
npm i clientlinker --save
```

Install flow pkg

```shell
npm i clientlinker-flow-pkghandler --save
```


# Useage

```javascript
var clientlinker = require('clientlinker');
var linker = clientlinker({
  flows: ['pkghandler'],
  clients: {
    client: {
      pkghandler: 'clientlinker-flow-confighandler-test/lib/methods'
    }
  }
});

linker.flow('pkghandler', require('clientlinker-flow-pkghandler'));

// use
linker.run('client.method', null, {id: 13})
  .then(function(){});
```


[npm-image]: http://img.shields.io/npm/v/clientlinker-flow-pkghandler.svg
[downloads-image]: http://img.shields.io/npm/dm/clientlinker-flow-pkghandler.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-pkghandler
[travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker-flow-pkghandler/master.svg?label=linux
[travis-url]: https://travis-ci.org/Bacra/node-clientlinker-flow-pkghandler
[coveralls-image]: https://img.shields.io/coveralls/Bacra/node-clientlinker-flow-pkghandler.svg
[coveralls-url]: https://coveralls.io/github/Bacra/node-clientlinker-flow-pkghandler
[license-image]: http://img.shields.io/npm/l/clientlinker-flow-pkghandler.svg
