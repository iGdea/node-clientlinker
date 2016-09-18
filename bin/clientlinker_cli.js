#!/usr/bin/env node

'use strict';
process.title = 'clientlinker';
process.env.CLIENTLINKER_CLI = true;

// hook console
require('./lib/stdout');
// start command
require('./main');
