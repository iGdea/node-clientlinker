#!/usr/bin/env node

process.title = 'clientlinker';
process.env.CLIENTLINKER_CLI = true;

// hook console
require('./lib/stdout').is_verbose = process.env.LOG_VERBOSE == 'true';
// start command
require('./main');
