const db = require('../config/database')

module.exports = {
    async chats(user) {
        return await db('chats').where({ sender_id: user.id }).orWhere({ receiver_id: user.id })
    }
}