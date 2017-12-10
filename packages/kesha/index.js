const hash = require('./hash')

function boundaryEntry(hash) {
  return (hash & 0x1f) === 0
}

function chunkStore(store) {
  const { chunks, currentEntries } = Object.keys(store)
    .sort()
    .reduce(
      ({ chunks, currentEntries }, key) => {
        const entry = { key, value: store[key] }
        currentEntries.push(entry)
        const entryHash = hash(entry)
        if (boundaryEntry(entryHash)) {
          const chunkHash = hash(currentEntries)
          chunks.push({ hash: chunkHash, entries: currentEntries })
          return {
            chunks,
            currentEntries: [],
          }
        } else {
          return {
            chunks,
            currentEntries,
          }
        }
      },
      { chunks: [], currentEntries: [] }
    )
  if (currentEntries.length > 0) {
    const chunkHash = hash(currentEntries)
    chunks.push({ hash: chunkHash, entries: currentEntries })
  }
  return chunks
}

function createMerkle(chunkHashes) {
  let hashes = chunkHashes

  if (hashes.length === 0) {
    return null
  } else if (hashes.length === 1) {
    return hashes[0]
  }

  while (hashes.length > 1) {
    const { pairs, last } = hashes.reduce(
      ({ pairs, last }, next) => {
        if (last) {
          pairs.push([last, next])
          return { pairs }
        } else {
          return { pairs, last: next }
        }
      },
      { pairs: [] }
    )
    hashes = pairs.map(([l, r]) => ({
      hash: hash(`${l.hash}:${r.hash}`),
      l,
      r,
    }))
    if (last) {
      hashes.push(last)
    }
  }
  return hashes[0]
}

function getMerkleHashes(merkle, hashes = []) {
  hashes.push(merkle.hash)
  if (merkle.l) {
    getMerkleHashes(merkle.l, hashes)
    getMerkleHashes(merkle.r, hashes)
  }
  return hashes
}

function create(store) {
  const chunkedStore = chunkStore(store)
  const cas = chunkedStore.reduce((cas, { hash, entries }) => {
    cas[hash] = entries
    return cas
  }, {})
  const chunkHashes = chunkedStore.map(({ hash }) => ({ hash }))
  const merkle = createMerkle(chunkHashes)
  return {
    cas,
    merkle,
  }
}

function diff(otherMerkle, { cas, merkle }) {
  if (otherMerkle.hash === merkle.hash) {
    return cas
  }
  const otherMerkleHashes = new Set(getMerkleHashes(otherMerkle))
  const newCas = {}
  function diffNodes(node) {
    const diffTree = { hash: node.hash }
    if (!otherMerkleHashes.has(node.hash)) {
      if (!node.l) {
        newCas[node.hash] = cas[node.hash]
      } else {
        diffTree.l = diffNodes(node.l)
        diffTree.r = diffNodes(node.r)
      }
    }
    return diffTree
  }
  return {
    cas: newCas,
    merkle: diffNodes(merkle),
  }
}

function patch({ cas, merkle }, delta) {
  if (delta.merkle.hash === merkle.hash) {
    return cas
  }
  function getMerkleNodes(node, merkelNodes = {}) {
    merkelNodes[node.hash] = node
    if (node.l) {
      getMerkleNodes(node.l, merkelNodes)
      getMerkleNodes(node.r, merkelNodes)
    }
    return merkelNodes
  }
  const currentMerkleNodes = getMerkleNodes(merkle)

  function getCasForNode(node, casForNode = {}) {
    if (node.l) {
      getCasForNode(node.l, casForNode)
      getCasForNode(node.r, casForNode)
    } else {
      casForNode[node.hash] = cas[node.hash]
    }
    return casForNode
  }

  function createNewCas(node, newCas = {}) {
    let newMerkle = { hash: node.hash }
    if (!node.l) {
      if (delta.cas[node.hash]) {
        newCas[node.hash] = delta.cas[node.hash]
      } else {
        newMerkle = currentMerkleNodes[node.hash]
        getCasForNode(currentMerkleNodes[node.hash], newCas)
      }
    } else {
      newMerkle.l = createNewCas(node.l, newCas).merkle
      newMerkle.r = createNewCas(node.r, newCas).merkle
    }
    return {
      cas: newCas,
      merkle: newMerkle,
    }
  }
  const updated = createNewCas(delta.merkle)
  return {
    cas: updated.cas,
    merkle: updated.merkle,
    store: casToStore(updated.cas),
  }
}

function casToStore(cas) {
  return Object.keys(cas).reduce((store, chunkKey) => {
    cas[chunkKey].forEach(entry => {
      store[entry.key] = entry.value
    })
    return store
  }, {})
}

module.exports = {
  create,
  diff,
  patch,
}
