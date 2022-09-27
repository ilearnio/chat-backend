import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', function (t) {
    t.string('id', 25).primary().notNullable();
    t.string('username', 255).notNullable().unique();
    t.string('firstName', 255);
    t.string('lastName', 255);
    t.string('email', 255).unique();
    t.string('password', 255);
    t.boolean('isOnline').notNullable();
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('rooms', function (t) {
    t.string('code', 25).primary().notNullable();
    t.string('ownerUserId', 25).notNullable().references('users.id');
    t.text('description');
    t.integer('userCount').unsigned().defaultTo(0).notNullable();
    t.timestamp('lastActivity').defaultTo(knex.fn.now());
    t.string('lastMessagePreview', 255);
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('messages', function (t) {
    t.string('id', 25).primary().notNullable();
    t.string('content', 255).notNullable();
    t.string('status', 255).defaultTo('sent');
    t.boolean('isSystem').defaultTo(false);
    t.string('userId', 25).references('users.id');
    t.string('roomCode', 255).notNullable();
    t.timestamp('createdAt').defaultTo(knex.fn.now());
    t.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('room_users', function (t) {
    t.string('roomCode', 25).references('rooms.code');
    t.string('userId').references('users.id');
    t.string('unread').defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
  await knex.schema.dropTable('rooms');
  await knex.schema.dropTable('messages');
  await knex.schema.dropTable('room_users');
}
