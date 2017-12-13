const express = require('express')
const bodyParser = require('body-parser')
const kesha = require('kesha')

module.exports = () => {
  const app = express.Router()
  app.use('/', (req, res, next) => {
    console.error('Request received:', req.url, req.method)
    next()
  })
  app.use('/', bodyParser.json())

  const stores = {}

  app.get('/', (req, res) => {
    const id = req.params.id
    res.json(Object.keys(stores))
  })

  app.post('/:id', (req, res) => {
    const id = req.params.id
    const store = req.body
    const { cas, merkle } = kesha.create(store)
    stores[id] = {
      store,
      cas,
      merkle,
    }
    res.end()
  })

  app.put('/:id', (req, res) => {
    const id = req.params.id
    const { hash, delta } = req.body
    if (!(stores[id] && stores[id].merkle.hash === hash)) {
      return res.status(409).end()
    }
    stores[id] = kesha.patch(stores[id], delta)
    res.end()
  })

  app.get('/:id/delta', (req, res) => {
    const id = req.params.id
    if (!stores[id]) res.status(404).end()
    res.json(kesha.diff(stores[id], req.body))
  })

  app.get('/:id', (req, res) => {
    const id = req.params.id
    if (!stores[id]) res.status(404).end()
    res.json(stores[id].store)
  })

  app.get('/:id/version', (req, res) => {
    const id = req.params.id
    if (!stores[id]) res.status(404).end()
    res.json(stores[id].merkle.hash)
  })

  return app
}
