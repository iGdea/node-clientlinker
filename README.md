Client Linker  [![Build Status](https://travis-ci.org/Bacra/node-client_linker.svg?branch=master)](https://travis-ci.org/Bacra/node-client_linker)
==================

# Install
```
npm install client_linker --save
npm install client_linker -g
```

# Useage

Linker config file:
```
var ClientLinker = require('client_linker');
var linker = ClientLinker(
	{
		flows: ['confighandler'],
		clients: {
			client: {
				confighandler: require('./pkghandler/client')
			}
		}
	});

module.exports = linker;
```

Assert cmd:

```
# clientlinker ./client_linker.js
# clientlinker ./client_linker.js method query body options
```

# Options

`flows`：启用这些系统组件，同时设置`clientDefaultOptions.flows`
`clients`：注册独立的clients配置
`customFlows`：自定义flows流程
`clientDefaultOptions`：client的默认配置
	`debug`：debug模式
	`anyToError`：将所有错误信息转化为Error对象，同设置`clientDefaultOptions.anyToError`

### Options Example

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

`methodKey`
`methodName`
`query`
`body`
`runOptions`
`activeDomain`
`client`
`promise`
`timing`


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
`flowsEnd`travis.yml



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




## Flow:hiproto

### linkerOptions

`hiprotoDir`：扫描这个目录下的.des文件，添加成client

### clientOptions

`hiproto`：proto描述文件地址
`hiprotoClientPath`：server配置文件地址，默认：/home/qspace/etc/clients/xxx.conf
`hiprotoClientAlias`：server命名空间，默认：client.name

### runOptions

`hiprotoParseBuffer`：不自动转返回的buffer数据 (默认true)





## Flow:httpproxy


### clientOptions

`httpproxy`
`httpproxyHeaders`
`httpproxyTimeout`
`httpproxyProxy`
`httpproxyErrorNext`

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
