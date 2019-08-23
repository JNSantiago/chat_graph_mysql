const { ApolloServer } = require('apollo-server')
const { importSchema } = require('graphql-import')
const jwt = require('jwt-simple')

const validateToken = authToken => {
    const token = authToken && authToken.substring(7)

    return new Promise((resolve, reject) => {
        if(token) {
            try {
                let tokenContent = jwt.decode(token, 'secret')
                resolve(tokenContent)
            }catch(e) {
                reject(e)
            }
        }else {
            reject('Nenhum Token Informado')
        }
    })
};

const findUser = authToken => {
    return tokenValidationResult => {
        // ... finds user by auth token and return a Promise, rejects in case of an error
        return new Promise((resolve, reject) => {
            try {
                let user = db('users').where({ email: tokenValidationResult.email }).first()
                resolve(user)
            }catch(e) {
                reject(e)
            }
        })
    };
};

const server = new ApolloServer({
    typeDefs: importSchema('./src/schemas/index.graphql'),
    resolvers: require('./src/resolvers'),
    subscriptions: {
    onConnect: (connectionParams, webSocket) => {
        console.log(connectionParams)
        if (connectionParams.authorization) {
            return validateToken(connectionParams.authorization)
                .then(findUser(connectionParams.authorization))
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