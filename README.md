Client Linker
==================

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]

# Install
```
npm install clientlinker --save
npm install clientlinker -g
```

# Useage

Linker Options Exmaple, see [Optons](https://github.com/Bacra/node-clientlinker/wiki/Linker-Options)
or [Self Flows Options](https://github.com/Bacra/node-clientlinker/wiki/Self-Flows-Options)

```
{
	flows: ['logger', 'custom', 'hiproto', 'localfile', 'httpproxy'],
	defaults: {
		anyToError: true,
		timeout: 4000
	},
	customFlows:
	{
		custom: function(query, body, callback, options) {}
	},
	clients: {
		mail: {
			read: {flows: ['hiproto']},
			send: {timeout: 10000}
		}
	}
}
```


Init Linker


```
var ClientLinker = require('clientlinker');
var linker = ClientLinker(options);
linker.loadFlow(name, path, module);
linker.addClient(name, options);

module.exports = linker;
```

You can custom flows [like this](https://github.com/Bacra/node-clientlinker/wiki/Custom-Flow)


Run in Terminal

```
# clientlinker ./clientlinker.conf.js
# clientlinker ./clientlinker.conf.js --action=method --query=query --body=body --options=options
# clientlinker --linker=./clientlinker.conf.js --clk-action=method --clk-body=body
```



[npm-image]: http://img.shields.io/npm/v/clientlinker.svg
[downloads-image]: http://img.shields.io/npm/dm/clientlinker.svg
[dependencies-image]: http://img.shields.io/david/Bacra/node-clientlinker.svg
[dependencies-url]: https://www.versioneye.com/user/projects/57c141d0939fc600508e8bee
[npm-url]: https://www.npmjs.org/package/clientlinker
[travis-image]: http://img.shields.io/travis/Bacra/node-clientlinker/master.svg
[travis-url]: https://travis-ci.org/Bacra/node-clientlinker
[coveralls-image]: https://img.shields.io/coveralls/Bacra/node-clientlinker.svg
[coveralls-url]: https://coveralls.io/github/Bacra/node-clientlinker
