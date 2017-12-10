/* eslint-env jest */

const kesha = require('../')

describe('kesha', () => {
  const initialStore = new Array(100).fill(0).reduce((acc, _, i) => {
    const key = `key-${i}`
    acc[key] = { id: key, val: 1 }
    return acc
  }, {})

  const nextStore = Object.assign({}, initialStore, {
    'key-10': { id: 'key-10', val: 2 },
  })

  const initial = kesha.create(initialStore)
  test('initial cas', () => {
    expect(initial.cas).toMatchSnapshot()
  })
  test('initial merkle', () => {
    expect(initial.merkle).toMatchSnapshot()
  })

  const next = kesha.create(nextStore)

  const delta = kesha.diff(initial.merkle, next)

  test('diff', () => {
    expect(delta).toMatchSnapshot()
  })

  const updated = kesha.patch(initial, delta)

  test('patch', () => {
    expect(updated).toMatchSnapshot()
  })
})
