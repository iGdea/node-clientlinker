#!/usr/bin/env node

'use strict';
process.title = 'clientlinker';
process.env.CLIENTLINKER_CLI = true;

// hook console
require('./lib/stdout').is_verbose = false;
// start command
require('./main');
