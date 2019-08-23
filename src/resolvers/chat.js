const db = require('../config/database')

module.exports = {
    async sender(chat) {
        return await db('users').where({ id: chat.sender_id }).first()
    },
    async receiver(chat) {
        return await db('users').where({ id: chat.receiver_id }).first()
    },
    async messages(chat) {
        return await db('messages').where({ id: chat.id })
    }
}