import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

export type SignupRequest = {
	name: string;
	email: string;
	password: string;
};

export type LoginRequest = Omit<SignupRequest, 'name'>;

export type Database = DrizzleD1Database<typeof schema> & {
	$client: D1Database;
};
