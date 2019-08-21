const { ApolloServer, gql } = require('apollo-server')
const bcrypt = require('bcrypt-nodejs')
const jwt = require('jwt-simple')

const dbConf = require('./knexfile')
const db = require('knex')(dbConf)

const typeDefs = gql`
    scalar Date

    type User {
        id: ID
        name: String!
        email: String!
        token: String
        chats: [Chat]
    }

    input UserRegisterInput {
        name: String!
        email: String!
        password: String!
    }

    input UserLoginInput {
        email: String!
        password: String!
    }

    type Chat {
        id: ID
        created_at: Date
        last_message: Message
        sender_id: Int
        receiver_id: Int
        sender: User
        receiver: User
        messages: [Message]
    }

    input ChatInput {
        sender_id: Int
        receiver_id: Int
    }

    type Message {
        id: ID
        sender: User
        receiver: User
        created_at: Date
        message: String!
        viewed: Boolean
        chat: Chat
    }

    type Mutation {
        register(data: UserRegisterInput): User
        createChat(data: ChatInput): Chat
        sendMessage(from_user: Int, for_user: Int, message: String, chat_id: Int): Message
    }

    type Query {
        login(data: UserLoginInput!): User
        users: [User]
        chats(user_id: Int): [Chat]
        registerChatLastMessage(message_id: Int): Message
        messages(chat_id: Int): [Message]
    }

    type Subscription {
        messageSent: Message
    }
`

const resolvers = {
    User: {
        async chats(user) {
            return await db('chats').where({ sender_id: user.id }).orWhere({ receiver_id: user.id })
        }
    },
    Chat: {
        async sender(chat) {
            return await db('users').where({ id: chat.sender_id }).first()
        },
        async receiver(chat) {
            return await db('users').where({ id: chat.receiver_id }).first()
        }
    },
    Query: {
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
        users() {
            return db('users')
        },
        async chats(_, data) {
            return await db('chats').where({ sender_id: data.user_id })
        }
    },
    Mutation: {
        async register(_, { data }) {
            try {
                const salt = bcrypt.genSaltSync()
                data.password = bcrypt.hashSync(data.password, salt)

                const [ id ] = await db('users')
                    .insert(data)

                return db('users')
                    .where({ id }).first()
            }catch(e) {
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
        async sendMessage(_, args) {
            // Verifica se o chat existe
            // Vincula a mensagem ao chat
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
})

server.listen().then(({url}) => {
    console.log(`Executando em ${url}`)
})