Clientlinker-flow-confighandler-test
====================================

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
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




# Usage

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


[npm-image]: https://img.shields.io/npm/v/clientlinker-flow-confighandler-test.svg
[downloads-image]: https://img.shields.io/npm/dm/clientlinker-flow-confighandler-test.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-confighandler-test
[license-image]: https://img.shields.io/npm/l/clientlinker-flow-confighandler-test.svg
[install-size-url]: https://packagephobia.now.sh/result?p=clientlinker-flow-confighandler-test
[install-size-image]: https://packagephobia.now.sh/badge?p=clientlinker-flow-confighandler-test
