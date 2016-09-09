'use strict'

const test = require('tape')
const depalert = require('../')

test('Global', function (t) {
  depalert('./test')
  t.ok(true, 'Displays a report.')
  t.end()
})
