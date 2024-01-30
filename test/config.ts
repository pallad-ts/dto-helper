import {Knex} from 'knex';

export const config = {
	postgres: {
		host: process.env.POSTGRES_HOST || 'localhost',
		port: process.env.POSTGRES_PORT ? +process.env.POSTGRES_PORT : undefined,
		database: process.env.POSTGRES_DB || 'dto_helper_test',
		user: process.env.POSTGRES_USER || 'postgres',
		password: process.env.POSTGRES_PASSWORD || 'admin'
	} as NonNullable<Knex.Config['connection']>
};
