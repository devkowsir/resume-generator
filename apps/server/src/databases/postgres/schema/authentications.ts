import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const providerEnum = pgEnum('provider', ['email', 'google']);

export const authentications = pgTable(
  'authentications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    passwordHash: text('password_hash'),
    provider: providerEnum().notNull(),
    providerId: text('provider_id'),
    createdAt: timestamp('created_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    }).$onUpdate(() => new Date()),
  },
  (table) => ({
    providerIndex: uniqueIndex().on(table.provider, table.providerId),
  }),
);

export const authenticationsRelations = relations(authentications, ({ one }) => ({
  user: one(users, { fields: [authentications.userId], references: [users.id] }),
}));

export type TAuthenticationData = typeof authentications.$inferSelect;
