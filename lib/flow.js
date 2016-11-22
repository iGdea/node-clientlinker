"use strict";

exports.Flow = Flow;

function Flow(name, handler)
{
	this.name = name || handler.name;
	this.handler = handler;
	this.methods = handler.methods;
	this.initConfig = handler.initConfig;
	this.init = handler.init;
}
