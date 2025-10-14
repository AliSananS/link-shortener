import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: integer('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	createdAt: integer('created_at').notNull(),
	expiresAt: integer('expires_at').notNull(),
});

export const links = sqliteTable('links', {
	shortCode: text('short_code').notNull(), // short link key
	userId: text('user_id').references(() => users.id),
	expiresAt: integer('expires_at'),
	createdAt: integer('created_at').notNull(),
	visitsCount: integer('visits_count').default(0),
});

export const analytics = sqliteTable('analytics', {
	id: text('id').primaryKey(),
	shortCode: text('short_code')
		.notNull()
		.references(() => links.shortCode),
	timestamp: integer('timestamp').notNull(),
	userAgent: text('user_agent'),
	ipAddress: text('ip_address'),
});
