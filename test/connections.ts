import {createConnections} from "@pallad/connections-dev";
import {config} from "./config";
import {loader} from "@pallad/migrator-loader-javascript";
import * as path from 'path';

export const connections = createConnections({
	postgres: {
		connection: config.postgres,
		getMigratorLoaders(knex) {
			return [
				loader({
					extensions: ['ts', 'js'],
					directories: [
						path.join(__dirname, '../migrations')
					],
					context: {knex}
				})
			]
		}
	}
});
