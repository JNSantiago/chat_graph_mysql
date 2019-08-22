const { ApolloServer, gql, PubSub } = require('apollo-server')
const bcrypt = require('bcrypt-nodejs')
const jwt = require('jwt-simple')

const dbConf = require('./knexfile')
const db = require('knex')(dbConf)

const pubSub = new PubSub()

const MESSAGE_SENT = 'MESSAGE_SENT'

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
        sender_id: Int
        receiver_id: Int
        sender: User
        receiver: User
        created_at: Date
        message: String!
        viewed: Boolean
        chat_id: Int
        chat: Chat
    }

    input MessageInput {
        sender_id: Int
        receiver_id: Int
        message: String!
        chat_id: Int
    }

    type Mutation {
        register(data: UserRegisterInput): User
        createChat(data: ChatInput): Chat
        sendMessage(data: MessageInput): Message
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
        },
        async messages(chat) {
            return await db('messages').where({ id: chat.id })
        }
    },
    Message: {
        async sender(message) {
            return await db('users').where({ id: message.sender_id }).first()
        },
        async receiver(message) {
            return await db('users').where({ id: message.receiver_id }).first()
        },
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
        async users() {
            return await db('users')
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
                let message = await db('messages').where({id}).first()
                pubsub.publish(MESSAGE_SENT, { messageSent: message });
                return message
            }catch(e) {
                throw new Error(e.sqlMessage)
            }
        }
    },
    Subscription: {
        messageSent: {
            subscribe: () => pubSub.asyncIterator([MESSAGE_SENT]),
        }
    }
}

const validateToken = authToken => {
    const token = authToken && authToken.substring(7)

    let promise = new Promise((resolve, reject))
    if(token) {
        try {
            let tokenContent = jwt.decode(token, 'secret')
            promise.resolve(tokenContent)
        }catch(e) {
            promise.reject(e)
        }
    }else {
        promise.reject('Nenhum Token Informado')
    }
};

const findUser = authToken => {
    return async tokenValidationResult => {
        // ... finds user by auth token and return a Promise, rejects in case of an error
        let promise = new Promise((resolve, reject))
        try {
            let user = await db('users').where({ email: tokenValidationResult.email }).first()
            promise.resolve(user)
        }catch(e) {
            promise.reject(e)
        }
    };
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    subscriptions: {
    onConnect: (connectionParams, webSocket) => {
        if (connectionParams.authToken) {
            return validateToken(connectionParams.authToken)
                .then(findUser(connectionParams.authToken))
                .then(user => {
                    console.log(user)
                    return {
                        currentUser: user,
                    };
                });
            }

            throw new Error('Missing auth token!');
        },
    },
    context: async ({ req, connection }) => {
        if(connection) {
            return connection.context
        }else {
            const token = req.headers.authorization || ""
            return { token }
        }
    }
})

server.listen().then(({ url, subscriptionsUrl }) => {
    console.log(`Executando em ${url}`)
    console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
})