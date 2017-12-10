/* eslint-env jest */

const server = require('../')

const db = new Array(1000).fill(0).reduce((acc, _, i) => {
  const key = `key-${i}`
  acc[key] = { key, n: 1 }
  return acc
}, {})

describe('kesha', () => {
  const contentAddresed = kesha.addressContent(db)
  test('addressContent', () => {
    expect(contentAddresed).toMatchSnapshot()
  })
  const partition = kesha._partition(contentAddresed)
  test('_partition', () => {
    expect(partition).toMatchSnapshot()
  })
  const merkle = kesha._createMerkle(partition)
  test('_createMerkle', () => {
    expect(merkle).toMatchSnapshot()
  })
})
