const user = require('./user')
const chat = require('./chat')
const message = require('./message')
const query = require('./query')
const mutation = require('./mutation')
const subscription = require('./subscription')

module.exports = {
    User: user,
    Chat: chat,
    Message: message,
    Query: query,
    Mutation: mutation,
    Subscription: subscription
}