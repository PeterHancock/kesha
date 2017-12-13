/* eslint-env jest */
const express = require('express')

const dbServer = require('../')

const request = require('request')

const r = (...$) =>
  new Promise((resolve, reject) => {
    request(...$, (err, ...rest) => {
      if (err) {
        reject(err)
      } else {
        resolve(...rest)
      }
    })
  })

const kesha = require('kesha')

const blob = `123456789
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

const initialStore = new Array(100).fill(0).reduce((acc, _, i) => {
  const key = `key-${i}`
  acc[key] = { id: key, val: blob }
  return acc
}, {})

const keyToChange = 'key-10'
const nextStore = Object.assign({}, initialStore, {
  [keyToChange]: { id: keyToChange, val: 'suprise' },
})
const db = kesha.create(nextStore)

describe('server', () => {
  test('integration', done => {
    const app = express()
    app.use('/', dbServer())
    const server = app.listen(9090, () => {
      r({
        url: 'http://localhost:9090/1',
        method: 'POST',
        json: true,
        body: initialStore,
      })
        .then(() =>
          r('http://localhost:9090/').then(({ body }) => {
            expect(body).toMatchSnapshot()
          })
        )
        .then(() =>
          r({
            url: 'http://localhost:9090/1/delta',
            method: 'GET',
            json: true,
            body: db.merkle,
          })
        )
        .then(response => {
          const patched = kesha.patch(db, response.body)
          return patched
        })
        .then(patched => {
          r({
            url: 'http://localhost:9090/1/version',
            method: 'GET',
            json: true,
          }).then(response => {
            const changedStore = Object.assign({}, patched.store, { 'key-0': 'HELLO' })
            const delta = kesha.diff(kesha.create(changedStore), patched)
            r({
              url: 'http://localhost:9090/1',
              method: 'PUT',
              json: true,
              body: { hash: response.body, delta },
            }).then(() => {
              r({
                url: 'http://localhost:9090/1/version',
                method: 'GET',
                json: true,
              }).then(response => {
                expect(response.body).toBe(delta.merkle.hash)
                console.error('closing server')
                server.close(done)
              })
            })
          })
        })
        .catch(() => {
          console.error('closing server')
          server.close(done)
        })
    })
  })
})
