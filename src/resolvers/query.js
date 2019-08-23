const db = require('../config/database')
const bcrypt = require('bcrypt-nodejs')
const jwt = require('jwt-simple')

module.exports = {
    async login(_, { data }) {
        const user = await db('users')
            .where({ email: data.email })
            .first()
        
        if(!user) {
            throw new Error('User/User does not exists')
        }

        const equals = bcrypt.compareSync(data.password, user.password)
        if(!equals) {
            throw new Error('User/Invalid Password')
        }

        user.token = jwt.encode(data, 'secret')
        return user
    },
    async users() {
        return await db('users')
    },
    async chats(_, data) {
        return await db('chats').where({ sender_id: data.user_id })
    }
}