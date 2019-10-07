Clientlinker-flow-pkghandler
============================

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
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


# Usage

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


[npm-image]: https://img.shields.io/npm/v/clientlinker-flow-pkghandler.svg
[downloads-image]: https://img.shields.io/npm/dm/clientlinker-flow-pkghandler.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-pkghandler
[license-image]: https://img.shields.io/npm/l/clientlinker-flow-pkghandler.svg
