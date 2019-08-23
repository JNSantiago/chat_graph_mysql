const { PubSub } = require('apollo-server')
const pubSub = new PubSub()

module.exports = {
    messageSent: {
        subscribe: () => pubSub.asyncIterator(['MESSAGE_SENT'])
    }
}