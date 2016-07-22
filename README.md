Client Linker  [![Build Status](https://travis-ci.org/Bacra/node-client_linker.svg?branch=master)](https://travis-ci.org/Bacra/node-client_linker)
==================

# Install
```
npm install client_linker --save
npm install client_linker -g
```

# Useage

Linker Options Exmaple

```
{
	flows: ['logger', 'custom', 'hiproto', 'localfile', 'httpproxy'],
	clientDefaultOptions: {
		anyToError: true,
		timeout: 4000
	},
	customFlows:
	{
		custom: function(query, body, callback, runOptions) {}
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
var ClientLinker = require('client_linker');
var linker = ClientLinker(options);
linker.loadFlow(name, path, module);
linker.addClient(name, options);

module.exports = linker;
```


Run in Cmd

```
# clientlinker ./client_linker.js
# clientlinker ./client_linker.js --action=method --query=query --body=body --options=options
# clientlinker --linker=./client_linker.js --clk-action=method --clk-query=query --clk-body=body --clk-options=options
```

# Options

`flows`：启用这些系统组件，同时设置`clientDefaultOptions.flows`
`clients`：注册独立的clients配置
`customFlows`：自定义flows流程
`clientDefaultOptions`：client的默认配置
	`debug`：debug模式
	`anyToError`：将所有错误信息转化为Error对象，同设置`clientDefaultOptions.anyToError`
	`retry`：接口失败重试次数



# Flows

使用Flows来组织一次数据请求。按照client配置中的flows定义顺序，逐个执行flows，直到完成数据请求任务。


## Flows Example

```
exports = module.exports = flows;
function flows(runtime, callback)
{
	callback.next();
}

// 可选接口
// 获取client下的method列表
exports.methods = function(client)
{
	return Promise.resolve(['.. method list ..']);
};
// 自动初始化client
exports.initConfig = function(linkerOptions)
{
	return Promise.resolve(['.. client list ..']);
};
```

### runtime

`methodKey`：接口调用key
`methodName`：接口名
`query`：参数1，路由信息
`body`：参数2，请求主体
`runOptions`：参数3，请求配置
`client`：client对象
`promise`：主promise
`timing`：时间信息
`retry`：已重试次数

### callback

`callback`
`resolve`
`reject`
`promise`
`next`

### timing

`navigationStart`
`lastFlowStart`
`lastFlowEnd`
`flowStart_*`
`flowEnd_*`
`flowsStart`
`flowsEnd`



## Flow:confighandler

### clientOptions

`confighandler`：设置client自定义的方法

```
// example
clientName: {
	confighandler: {
		methodName: function(query, body, callback, runOptions)
		{
			... do something ...
			callback();
		}
	}
}
```





## Flow:httpproxy


### clientOptions

`httpproxy`
`httpproxyHeaders`
`httpproxyTimeout`
`httpproxyProxy`
`httpproxyErrorNext`
`httpproxyKey`
`httpproxyKeyRemain`

### runOptions

`timeout`




## Flow:localfile

### linkerOptions

`localfileDir`

### clientOptions

`localfile`




## Flow:logger


### clientOptions

`logger`




## Flow:pkghandler

### linkerOptions

`pkghandlerDir`

### clientOptions

`pkghandler`
