const eventEmitter = require('events')
const eventBus = new eventEmitter.EventEmitter()

module.exports = eventBus;