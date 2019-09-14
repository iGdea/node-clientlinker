Clientlinker-flow-confighandler-test
====================================

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
npm i clientlinker-flow-confighandler-test --save-dev
```




# Useage

```javascript
var clientlinker = require('clientlinker');
var confighandlerTest = require('clientlinker-flow-confighandler-test');
var linker = clientlinker({
  flows: ['confighandler'],
  clients: {
    client: {
      confighandler: confighandlerTest.methods
    }
  }
});


linker.flow('confighandler', require('clientlinker-flow-confighandler'));

describe('#test', function()
{
  confighandlerTest.run(linker, 'client');
});
```


[npm-image]: http://img.shields.io/npm/v/clientlinker-flow-confighandler-test.svg
[downloads-image]: http://img.shields.io/npm/dm/clientlinker-flow-confighandler-test.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-confighandler-test
[travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker-flow-confighandler-test/master.svg?label=linux
[travis-url]: https://travis-ci.org/Bacra/node-clientlinker-flow-confighandler-test
[coveralls-image]: https://img.shields.io/coveralls/Bacra/node-clientlinker-flow-confighandler-test.svg
[coveralls-url]: https://coveralls.io/github/Bacra/node-clientlinker-flow-confighandler-test
[license-image]: http://img.shields.io/npm/l/clientlinker-flow-confighandler-test.svg
[install-size-url]: https://packagephobia.now.sh/result?p=clientlinker-flow-confighandler-test
[install-size-image]: https://packagephobia.now.sh/badge?p=clientlinker-flow-confighandler-test
