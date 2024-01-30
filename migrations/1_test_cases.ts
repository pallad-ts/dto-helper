import {Knex} from "knex";

export async function up({knex}: { knex: Knex }) {
	await knex.schema.createTable('full', t => {
		t.specificType('id', 'char(26)');

		t.string('field', 500);
		t.dateTime('created_at')
			.notNullable()
			.defaultTo(knex.fn.now());
		t.dateTime('updated_at')
			.notNullable()
			.defaultTo(knex.fn.now());
		t.primary(['id']);
	});

	await knex.schema.createTable('only_created_at', t => {
		t.specificType('id', 'char(26)');

		t.string('field', 400);

		t.dateTime('created_at')
			.notNullable()
			.defaultTo(knex.fn.now());

		t.primary(['id']);
	});

	await knex.schema.createTable('only_updated_at', t => {
		t.specificType('id', 'char(26)');

		t.string('field', 600);

		t.dateTime('updated_at')
			.notNullable()
			.defaultTo(knex.fn.now());

		t.primary(['id']);
	});
}
