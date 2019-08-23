const db = require('../config/database')
const bcrypt = require('bcrypt-nodejs')

const { PubSub } = require('apollo-server')
const pubSub = new PubSub()

module.exports = {
    async register(_, { data }) {
        try {
            const salt = bcrypt.genSaltSync()
            data.password = bcrypt.hashSync(data.password, salt)

            const [ id ] = await db('users')
                .insert(data)

            return db('users')
                .where({ id }).first()
        }catch(e) {
            console.log(e)
            throw new Error(e.sqlMessage)
        }
    },
    async createChat(_, { data }) {
        try {
            const chat = {
                last_message: '',
                sender_id: data.sender_id,
                receiver_id: data.receiver_id
            }

            const [ id ] = await db('chats')
                .insert(chat)

            return db('chats')
                .where({ id }).first()
        }catch(e) {
            throw new Error(e.sqlMessage)
        }
    },
    async sendMessage(_, { data }) {
        try {
            const chat = await db('chats').where({ id: data.chat_id }).first()

            if(!chat) {
                const chat = {
                    last_message: '',
                    sender_id: data.sender_id,
                    receiver_id: data.receiver_id
                }

                const [ id ] = await db('chats')
                    .insert(chat)
                chat = db('chats').where({ id }).first()
            }

            const message = {
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                message: data.message,
                chat_id: chat.id
            }

            const [ id ] = await db('messages').insert(message)
            const messageSent = await db('messages').where({id}).first()
            pubSub.publish('MESSAGE_SENT', { messageSent });
            return messageSent
        }catch(e) {
            console.log(e)
            throw new Error(e.sqlMessage)
        }
    }
}