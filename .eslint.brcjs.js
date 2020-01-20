/**
 * 由于overrides，直接用extend会导致basePath错误
 * 所以使用的时候，需要先创建一个tmp，将路径转到根目录
 */
module.exports = require('eslint-config-brcjs');
