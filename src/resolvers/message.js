const db = require('../config/database')

module.exports = {
    async sender(message) {
        return await db('users').where({ id: message.sender_id }).first()
    },
    async receiver(message) {
        return await db('users').where({ id: message.receiver_id }).first()
    }
}