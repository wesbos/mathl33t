import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now),
});

export const gameStats = sqliteTable('game_stats', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  problemsSolved: integer('problems_solved').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
  totalAttempts: integer('total_attempts').notNull().default(0),
  lastPlayed: integer('last_played', { mode: 'timestamp' }).notNull().default(Date.now),
});
