/* eslint-env jest */

const kesha = require('./')

const blob = `
123456789
123456789
123456789
123456789
123456789
123456789
123456789
123456789
123456789
123456789
`

const initialStore = new Array(100000).fill(0).reduce((acc, _, i) => {
  const key = `key-${i}`
  acc[key] = { id: key, val: blob }
  return acc
}, {})

const nextStore = Object.assign({}, initialStore, {
  'key-10': { id: 'key-10', val: blob + 'xxxxxxxxx' },
})

const time = (name, f) => {
  console.time(name)
  const rtn = f()
  console.timeEnd(name)
  return rtn
}

const next = time('update store', () => kesha.create(nextStore))

time('kesha', () => {
  time('poll', () => {
    const initial = time('create request', () => kesha.create(initialStore))
    time('send request', () => {
      const serializedMerkle = JSON.stringify(initial.merkle)
      console.log('poll request size', serializedMerkle.length)
      JSON.parse(serializedMerkle)
    })
    const delta = time('create delta', () => kesha.diff(initial.merkle, next))
    time('send response', () => {
      const serializedDelta = JSON.stringify(delta)
      // console.error(JSON.stringify(delta, null, 2))
      console.log('poll response size', serializedDelta.length)
      JSON.parse(serializedDelta)
    })
    time('apply patch', () => {
      kesha.patch(initial, delta)
    })
  })
})
console.error(`
---------------------------
`)

time('all data', () => {
  time('poll', () => {
    const serializedStore = JSON.stringify(nextStore)
    console.log('transfer size', serializedStore.length)
    JSON.parse(serializedStore)
  })
})
