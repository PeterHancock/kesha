const xxhash = require('xxhashjs')

function hash(str) {
  return xxhash.h32(str, 0xabcd).toNumber()
}

module.exports = function(value) {
  return typeof value === 'string' ? hash(value) : hash(JSON.stringify(value))
}
