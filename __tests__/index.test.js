const objdb = require('../')

const db = new Array(1000).fill(0).reduce((acc, _, i) => {
  const key = `key-${i}`
    acc[key] = { key, n: 1 }
    return acc
}, {})

describe('obj-db', () => {
  const contentAddresed = objdb.addressContent(db)
  test('addressContent', () => {
    expect(contentAddresed).toMatchSnapshot()
  })
  const partition = objdb._partition(contentAddresed)
  test('_partition', () => {
    expect(partition).toMatchSnapshot()
  })
  const merkle = objdb._createMerkle(partition)
  test('_createMerkle', () => {
    expect(merkle).toMatchSnapshot()
  })
})
