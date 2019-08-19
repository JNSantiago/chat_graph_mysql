
exports.up = function(knex, Promise) {
    return knex.schema.createTable('messages', table => {
        table.increments('id').primary()
        table.string('name').notNull()
        table.string('message').notNull()
        table.boolean('viewed')
            .notNull().defaultTo(false)

        table.integer('sender_id').unsigned()
        table.integer('receiver_id').unsigned()
        table.integer('chat_id').unsigned()
        table.foreign('sender_id').references('users.id')
        table.foreign('receiver_id').references('users.id')
        table.foreign('chat_id').references('chats.id')

        table.timestamp('created_at')
            .defaultTo(knex.fn.now())
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('messages')
};