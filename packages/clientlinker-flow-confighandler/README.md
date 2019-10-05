Clientlinker-flow-confighandler
==============================

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
npm i clientlinker-flow-confighandler --save
```


# Useage

```javascript
var clientlinker = require('clientlinker');
var linker = clientlinker({
  flows: ['confighandler'],
  clients: {
    client: {
      confighandler: {
        clientHanlder: function(query, body, callback, options)
        {
          return Promise.resolve({result: {}});
        },
      }
    }
  }
});

linker.flow('confighandler', require('clientlinker-flow-confighandler'));

// use
linker.run('client.clientHanlder', null, {id: 13})
  .then(function(){});
```


[npm-image]: https://img.shields.io/npm/v/clientlinker-flow-confighandler.svg
[downloads-image]: https://img.shields.io/npm/dm/clientlinker-flow-confighandler.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-confighandler
[travis-image]: https://img.shields.io/travis/com/Bacra/node-clientlinker/master.svg?label=linux
[travis-url]: https://travis-ci.com/Bacra/node-clientlinker
[coveralls-image]: https://img.shields.io/coveralls/Bacra/node-clientlinker.svg
[coveralls-url]: https://coveralls.io/github/Bacra/node-clientlinker
[license-image]: https://img.shields.io/npm/l/clientlinker-flow-confighandler.svg
[install-size-url]: https://packagephobia.now.sh/result?p=clientlinker-flow-confighandler
[install-size-image]: https://packagephobia.now.sh/badge?p=clientlinker-flow-confighandler
