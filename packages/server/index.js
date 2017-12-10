const express = require('express')
const bodyParser = require('body-parser')
const kesha = require('kesha')

const app = express()
app.use('/', (req, res, next) => {
  console.error('Request received:', req.url)
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
  stores[id] = {
    store,
    kesha: kesha.create(store),
  }
  res.end()
})

app.get('/:id/diff', (req, res) => {
  const id = req.params.id
  res.json(kesha.diff(req.body, stores[id].kesha))
})

app.get('/:id', (req, res) => {
  const id = req.params.id
  res.json(stores[id].store)
})

app.listen(9090)
