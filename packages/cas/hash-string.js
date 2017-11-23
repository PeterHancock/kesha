const xxhash = require('xxhashjs')

module.exports = function (str) {
  return xxhash.h32(str, 0xABCD).toNumber()
}
