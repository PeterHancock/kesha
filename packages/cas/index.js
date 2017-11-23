const hash = require('./hash-string')

function hashValue (value) {
  return hash(JSON.stringify(value))
}

function addressContent (store) {
  return Object.keys(store)
    .map((key) => ({ key, value: store[key] }))
    .reduce((acc, entry) => {
      acc[hashValue(entry)] = entry
      return acc
    },
    {}
  )
}

function partition (cas) {
  return Object.keys(cas)
  .map((key) => ({ key, keyPartition: parseInt(key) & 0xff }))
    .sort((a, b) => a.keyPartition - b.keyPartition)
    .reduce(
      ({ partitioned, currentKeyPartition, currentKeys }, { key, keyPartition }) => {
        if (currentKeys) {
          if (keyPartition === currentKeyPartition) {
            currentKeys.push(key)
            return {
              partitioned,
              currentKeyPartition,
              currentKeys
            }
          } else {
            const keys = currentKeys.sort()
            partitioned.push({ hash: hashValue(keys).toString(16).toUpperCase(), keys })
            return {
              partitioned,
              currentKeyPartition: keyPartition,
              currentKeys: [key]
            }
          }
        } else {
          return {
            partitioned,
            currentKeyPartition: keyPartition,
            currentKeys: [key]
          }
        }
      },
      { partitioned: [] }
    ).partitioned
}

function createMerkle (partitionedCas) {
  let hashes = partitionedCas

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
    hashes = pairs.map(([l, r]) => ({ h: hash(`${l.hash}${r.hash}`), l, r }))
    if (last) {
      hashes.push(last)
    }
  }
  return hashes[0]
}

function create (db) {
  const cas = addressContent(db)
  const merkle = createMerkle(partition(cas))
  return {
    cas,
    merkle
  }
}

module.exports = {
  _partition: partition,
  _createMerkle: createMerkle,
  create,
  addressContent
}
