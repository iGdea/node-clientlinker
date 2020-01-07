Clientlinker-flow-httpproxy
============================

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
npm i clientlinker-flow-httpproxy --save
```


# Usage

```javascript
var clientlinker = require('clientlinker');
var linker = clientlinker({
  flows: ['confighandler', 'httpproxy'],
  defaults: {
    httpproxy: 'http://localhost/clientlinker_proxy',
    httpproxyMaxLevel: 5,
    httpproxyTimeout: 10000,
    httpproxyProxy: 'http://127.0.0.1:8888' || false,
    httpproxyHeaders: {},
    httpproxyKey: 'aeskey',
    httpproxyKeyRemain: 5000,
  },
  clients: {
    client: {
      confighandler: {
        clientHanlder: function(query, body, callback, options) {
          return Promise.resolve({result: {}});
        }
      }
    }
  }
});

linker.flow('confighandler', require('clientlinker-flow-confighandler'));
linker.flow('httpproxy', require('clientlinker-flow-httpproxy'));

// use
linker.run('client.clientHanlder', null, {id: 13})
  .then(function(){});
```



[npm-image]: https://img.shields.io/npm/v/clientlinker-flow-httpproxy.svg
[downloads-image]: https://img.shields.io/npm/dm/clientlinker-flow-httpproxy.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-httpproxy
[license-image]: https://img.shields.io/npm/l/clientlinker-flow-httpproxy.svg
[install-size-url]: https://packagephobia.now.sh/result?p=clientlinker-flow-httpproxy
[install-size-image]: https://packagephobia.now.sh/badge?p=clientlinker-flow-httpproxy
