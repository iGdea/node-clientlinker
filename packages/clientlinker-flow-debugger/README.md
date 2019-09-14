Clientlinker-flow-debugger
==========================

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
npm i clientlinker-flow-debugger --save
```


# Useage

```javascript
var clientlinker = require('clientlinker');
var linker = clientlinker({
  flows: ['debugger', 'confighandler'],
  clients: {
    client: {
      debuggerRuntime: true,
      confighandler: {
        clientHanlder: function(query, body, callback, options)
        {
          return Promise.resolve({result: {}});
        },
      }
    }
  }
});

linker.flow('debugger', require('clientlinker-flow-debugger'));
linker.flow('confighandler', require('clientlinker-flow-confighandler'));

// use
linker.run('client.clientHanlder', null, {id: 13})
  // return runtime instead of data
  .then(function(runtime){});
```


[npm-image]: http://img.shields.io/npm/v/clientlinker-flow-debugger.svg
[downloads-image]: http://img.shields.io/npm/dm/clientlinker-flow-debugger.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-debugger
[travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker-flow-debugger/master.svg?label=linux
[travis-url]: https://travis-ci.org/Bacra/node-clientlinker-flow-debugger
[coveralls-image]: https://img.shields.io/coveralls/Bacra/node-clientlinker-flow-debugger.svg
[coveralls-url]: https://coveralls.io/github/Bacra/node-clientlinker-flow-debugger
[license-image]: http://img.shields.io/npm/l/clientlinker-flow-debugger.svg
[install-size-url]: https://packagephobia.now.sh/result?p=clientlinker-flow-debugger
[install-size-image]: https://packagephobia.now.sh/badge?p=clientlinker-flow-debugger
