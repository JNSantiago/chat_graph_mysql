const { ApolloServer, gql } = require('apollo-server')
const dbConf = require('./knexfile')
const db = require('knex')(dbConf)

const typeDefs = gql`
    scalar Date

    type User {
        id:ID
        name: String!
        email: String!
        password: String!
        chats: [Chat]
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
        sendMessage(from_user: Int, for_user: Int, message: String, chat_id: Int)
    }

    type Query {
        register: User
        login: User
        users: [User]
        chats(user_id: Int): [Chat]
        messages(chat_id: Int): [Message]
    }

    type Subscription {
        messageSent: Message
    }
`

const resolvers = {

}

const server = new ApolloServer({
    typeDefs,
    resolvers
})

server.listen().then(({url}) => {
    console.log(`Executando em ${url}`)
})