ClientLinker-Core
==================

Linker all clients whether rpc, addon, http request, mock data, local file ...

A solution to break out of network and OS.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![NPM License][license-image]][npm-url]
[![Install Size][install-size-image]][install-size-url]

# Install

```shell
npm install clientlinker-core --save
```

# Usage

## Options

Linker Options Exmaple, see [Optons](https://github.com/Bacra/node-clientlinker/wiki/Linker-Options)
or [Self Flows Options](https://github.com/Bacra/node-clientlinker/wiki/Self-Flows-Options)

```javascript
{
  flows: ['logger', 'pkghandler', 'httpproxy'],
  defaults: {
    timeout: 4000
  },
  clients: {
    mail: {
      // modify defaults flows
      flows: ['confighandler', 'httpproxy'],
      confighandler: {
        read: function(query, body, callback, options) {
          callback(null, {content: 'hi,'});
        },
        send: function(query, body, callback, options) {
          return Promise.resolve({id: 'xxxx'});
        }
      }
    },

    // use defaults
    profile: {
      pkghandler: __dirname+'/clients/profile.js'
    }
  }
}
```

## Initialize

```javascript
// `clientlinker.conf.js` file content

var clientlinker = require('clientlinker-core');
var linker = clientlinker(options);

// Register flows
linker.flow('confighandler', require('clientlinker-flow-confighandler'));
linker.flow('logger', require('clientlinker-flow-logger'));
linker.flow('httpproxy', require('clientlinker-flow-httpproxy'));
linker.flow('pkghandler', require('clientlinker-flow-pkghandler'));

// Add clients outsid of config step
linker.client(name, clientOptions);

module.exports = linker;
```

## Run

### Run in Server

```javascript
var linker = require('./clientlinker.conf.js');

linker.run('mail.read', userid, {mailid: 'xxxx'}, options)
  .then(function(data){});
```

## Upgrade

### 10x

Remove deps handlers

`runtime.runOptions` `runtime.methodKey` `runtime.lastFlow`
`flow.register`
`runtime.getRunnedFlowByName` `runtime.runnedFlows` `runtime.isFinished` `runtime.isStarted`
`linker.add` `linker.addClient` `linker.parseMethodKey` `linker.getFlow` `linker.runByKey` `linker.bindFlow` `linker.loadFlow`
`linker.onInit` `linker.runInShell`

Remove attrs
`runtime.promise`

Remove options
`option.clientDefaultOptions`

Flow not support `init` callback.

Remove callback handlers of `flow.run(runtime, callback)`

`callback.toFuncCallback`
`callback.reject` `callback.resolve` `callback.callback` `callback.nextAndResolve` `callback.promise` `callback.nextRunner`

`flow.run` ret switch to Promise always.

Remove `retry` event of `runtime`. Add `retry` event of `linker`.


[npm-image]: https://img.shields.io/npm/v/clientlinker-core.svg
[downloads-image]: https://img.shields.io/npm/dm/clientlinker-core.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-core
[license-image]: https://img.shields.io/npm/l/clientlinker-core.svg
[install-size-url]: https://packagephobia.now.sh/result?p=clientlinker-core
[install-size-image]: https://packagephobia.now.sh/badge?p=clientlinker-core
