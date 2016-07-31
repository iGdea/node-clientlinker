"use strict";

var assert	= require('assert');
var json	= require('../lib/json');

describe('json', function()
{
	it('stringify', function()
	{
		var err = new Error('err message');
		err.errCode = err.code = -499;
		var data = {
			result: err,
			data: {
				string: "string",
				number: 123,
				buffer: new Buffer('buffer')
			}
		};

		var newData = json.stringify(data);
		assert(!(newData.result instanceof Error));
		assert.equal(newData.result.type, json.CONST_VARS.ERROR_KEY);
		assert(!!newData.result.data);
		assert.equal(newData.result.data.message, 'err message');
		assert.equal(newData.result.data.stack.indexOf('Error: err message'), 0);
		assert.equal(newData.result.data.errCode, -499);
		assert.equal(newData.result.data.originalStack, undefined);

		assert(!!newData.data.buffer);
		assert.equal(newData.data.buffer.type, json.CONST_VARS.BUFFER_KEY);
		assert(Array.isArray(newData.data.buffer.data));

		assert.equal(newData.data.string, 'string');
		assert.equal(newData.data.number, 123);
	});

	it('parse', function()
	{
		var data = {
			"result": {
				"type": "err_1454824224156",
				"data": {
					"code": -499,
					"errCode": -499,
					"stack": "Error: err message",
					"message": "err message"
				}
			},
			"data": {
				"string": "string",
				"number": 123,
				"buffer": {
					"type": "buf_1454824224156",
					"data": [98, 117, 102, 102, 101, 114]
				},
				"buffer2": {
					"type": "buf_2222222222222",
					"data": [98, 117, 102, 102, 101, 114]
				}
			}
		};
		var TYPES = {
			BUFFER_KEY: 'buf_1454824224156',
			ERROR_KEY: 'err_1454824224156'
		}

		var newData = json.parse(data, TYPES);
		assert(!!newData.data);
		assert(newData.result instanceof Error);
		assert.equal(newData.result.message, 'err message');
		assert.equal(newData.result.errCode, -499);
		assert.equal(newData.result.stack, 'Error: err message');
		assert(newData.result.originalStack);
		assert.notEqual(newData.result.originalStack, 'Error: err message');

		assert(Buffer.isBuffer(newData.data.buffer));
		assert(newData.data.buffer.toString(), 'buffer');
		assert(newData.data.buffer.toString('base64'), 'YnVmZmVy');
		assert(!Buffer.isBuffer(newData.data.buffer2));

		assert.equal(newData.data.string, 'string');
		assert.equal(newData.data.number, 123);
	});
});
