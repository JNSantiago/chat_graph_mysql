
exports.up = function(knex, Promise) {
    return knex.schema.createTable('chats', table => {
        table.increments('id').primary()
        table.string('last_message')

        table.integer('sender_id').unsigned()
        table.integer('receiver_id').unsigned()
        table.foreign('sender_id').references('users.id')
        table.foreign('receiver_id').references('users.id')

        table.timestamp('created_at')
            .defaultTo(knex.fn.now())
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('chats')
};
