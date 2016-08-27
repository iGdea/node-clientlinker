Client Linker
==================

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![Dependencies][dependencies-image]][npm-url]
[![Build Status][travis-image]][travis-url]

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
