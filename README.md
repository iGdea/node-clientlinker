Client Linker
==================

Linker all clients whether rpc, addon, http request, mock data, local file ...

A solution to break out of network and OS.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor Status][appveyor-image]][appveyor-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![NPM License][license-image]][npm-url]

# Install

```shell
npm install clientlinker --save
npm install clientlinker -g
```

# Useage

### Options

Linker Options Exmaple, see [Optons](https://github.com/Bacra/node-clientlinker/wiki/Linker-Options)
or [Self Flows Options](https://github.com/Bacra/node-clientlinker/wiki/Self-Flows-Options)

```javascript
{
	flows: ['logger', 'custom', 'pkghandler' 'localfile', 'httpproxy'],
	// pkghandlerDir: __dirname+'/pkghandler',
	defaults: {
		anyToError: true,
		timeout: 4000
	},
	customFlows: {
		custom: function(runtime, callback) {}
	},
	clients: {
		mail: {
			// modify defaults flows
			flows: ['confighandler'],
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
		profile: null
	}
}
```

### Initialize

```javascript
// `clientlinker.conf.js` file content

var ClientLinker = require('clientlinker');
var linker = ClientLinker(options);

// Add flows and clients outsid of config step
linker.loadFlow(path, module);
linker.addClient(name, options);

module.exports = linker;
```

You can custom flows [Like This](https://github.com/Bacra/node-clientlinker/wiki/Custom-Flow).

Width custom flows, you can link any rpc

and get all data anywhere through `httpproxy` Flow.


### Run

#### Run in Server

```javascript
var clientlinker = require('./clientlinker.conf.js');

clientlinker.run('mail.read', userid, {mailid: 'xxxx'}, callback, options);

// or use promise
clientlinker.run('mail.read', userid, {mailid: 'xxxx'}, options)
	.then(function(data){});
```

#### Run in Shell

```javascript
// you can use `runInShell` instead of `run`.
// Of course, you can continue to use `run`.
// example

var clientlinker = require('./clientlinker.conf.js');

clientlinker.runInShell('mail.read', userid, {mailid: 'xxxx'}, callback, options);
```

#### Run in Terminal

```shell
#### List all Clients and Methods
clientlinker ./clientlinker.conf.js

#### Run action directly in Terminal
clientlinker ./clientlinker.conf.js --action=method --query=query --body=body --options=options
clientlinker --linker=./clientlinker.conf.js --clk-action=method --clk-body=body
```


### Upgrade

#### 4.x.x => 5.0.0

* Please upgrade server first, if you are using `httpproxy` flow


[npm-image]: http://img.shields.io/npm/v/clientlinker.svg
[downloads-image]: http://img.shields.io/npm/dm/clientlinker.svg
[dependencies-image]: http://img.shields.io/david/Bacra/node-clientlinker.svg
[dependencies-url]: https://www.versioneye.com/nodejs/clientlinker
[npm-url]: https://www.npmjs.org/package/clientlinker
[travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker/master.svg?label=linux
[travis-url]: https://travis-ci.org/Bacra/node-clientlinker
[travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker/master.svg?label=linux
[travis-url]: [travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker/master.svg?label=linux
[appveyor-image]: https://img.shields.io/appveyor/ci/Bacra/node-clientlinker/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/Bacra/node-clientlinker
[coveralls-image]: https://img.shields.io/coveralls/Bacra/node-clientlinker.svg
[coveralls-url]: https://coveralls.io/github/Bacra/node-clientlinker
[license-image]: http://img.shields.io/npm/l/clientlinker.svg
