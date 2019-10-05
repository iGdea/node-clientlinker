Clientlinker-flow-mysql
========================

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
npm i clientlinker-flow-mysql --save
```


# Useage

```javascript
var clientlinker = require('clientlinker');
var linker = clientlinker({
  flows: ['mysql'],
  clients: {
    mysqlCustomClient: {
      mysqlConfigFile: '/etc/dbconfig.conf',
      mysqlConfigKey: 'DBItemName',
      mysqlhandler: {
        clientHanlder: {
          sql: 'SELECT `name` FROM `db_example` WHERE `id`= ?',
          keys: ['id'],
        },
        subKeys: {
          sql: 'INSERT INTO `db_example` (`name`, `value`) VALUES ?',
          keys: ['info'],
          subKeys: {info: ['name', 'value']}
        }
      }
    }
  }
});

linker.loadFlow('mysql', 'clientlinker-flow-mysql', module);


// use
linker.run('mysqlCustomClient.clientHanlder', null, {id: 13})
  .then(function(){});

linker.run('mysqlCustomClient.subKeys', null, {info: {name: 1, value: 2}});
linker.run('mysqlCustomClient.subKeys', null, {
  info: [
    {name: 1, value: 2},
    {name: 2, value: 2}
  ]});
```


[npm-image]: https://img.shields.io/npm/v/clientlinker-flow-mysql.svg
[downloads-image]: https://img.shields.io/npm/dm/clientlinker-flow-mysql.svg
[npm-url]: https://www.npmjs.org/package/clientlinker-flow-mysql
[license-image]: https://img.shields.io/npm/l/clientlinker-flow-mysql.svg
