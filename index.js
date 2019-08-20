const { ApolloServer, gql } = require('apollo-server')
const bcrypt = require('bcrypt-nodejs')

const dbConf = require('./knexfile')
const db = require('knex')(dbConf)

const typeDefs = gql`
    scalar Date

    type User {
        id: ID
        name: String!
        email: String!
        password: String!
        chats: [Chat]
    }

    input UserRegisterInput {
        name: String
        email: String
        password: String
    }

    type Chat {
        id: ID
        created_at: Date
        last_message: Message
        sender_user: User
        received_user: User
        messages: [Message]
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
        sendMessage(from_user: Int, for_user: Int, message: String, chat_id: Int): Message
    }

    type Query {
        users: [User]
        chats(user_id: Int): [Chat]
        messages(chat_id: Int): [Message]
    }

    type Subscription {
        messageSent: Message
    }
`

const resolvers = {
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