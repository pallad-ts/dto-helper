import {connections} from "./connections";
import {RDBMSHelper} from "@src/RDBMSHelper";
import {Mapper} from '@pallad/mapper';
import {create} from '@pallad/id';

namespace DTO {
	export class Full {
		readonly id!: string;
		readonly field!: string;
		readonly createdAt!: Date;
		readonly updatedAt!: Date;

		constructor(data: Full) {
			Object.assign(this, data);
		}
	}

	export class OnlyCreatedAt {
		readonly id!: string;
		readonly field!: string;
		readonly createdAt!: Date;

		constructor(data: OnlyCreatedAt) {
			Object.assign(this, data);
		}
	}

	export class OnlyUpdatedAt {
		readonly id!: string;
		readonly field!: string;
		readonly updatedAt!: Date;

		constructor(data: OnlyCreatedAt) {
			Object.assign(this, data);
		}
	}
}


describe('RDBMSHelper', () => {
	const connection = connections.postgres;
	connection.setupBeforeAndAfterAll();

	connection.setupAfterEach({
		truncateTables: ['full', 'only_created_at', 'only_updated_at']
	});

	let helper_full: RDBMSHelper<DTO.Full, string>;
	let helper_onlyCreatedAt: RDBMSHelper<DTO.OnlyCreatedAt, string>;
	let helper_onlyUpdatedAt: RDBMSHelper<DTO.OnlyUpdatedAt, string>;

	beforeEach(() => {
		helper_full = new RDBMSHelper<DTO.Full, string>(connection.connection, {
			mapper: Mapper.create<DTO.Full>()
				.useLightFactory(x => new DTO.Full(x))
				.registerMapping('id')
				.registerMapping('field')
				.registerMapping('createdAt', 'created_at')
				.registerMapping('updatedAt', 'updated_at'),
			idGenerator: create,
			table: 'full',
		});

		helper_onlyCreatedAt = new RDBMSHelper<DTO.OnlyCreatedAt, string>(connection.connection, {
			mapper: Mapper.create<DTO.OnlyCreatedAt>()
				.useLightFactory(x => new DTO.OnlyCreatedAt(x))
				.registerMapping('id')
				.registerMapping('field')
				.registerMapping('createdAt', 'created_at'),
			idGenerator: create,
			table: 'only_created_at',
			timestamps: {
				createdAt: 'created_at'
			}
		});

		helper_onlyUpdatedAt = new RDBMSHelper<DTO.OnlyUpdatedAt, string>(connection.connection, {
			mapper: Mapper.create<DTO.OnlyUpdatedAt>()
				.useLightFactory(x => new DTO.OnlyUpdatedAt(x))
				.registerMapping('id')
				.registerMapping('field')
				.registerMapping('updatedAt', 'updated_at'),
			idGenerator: create,
			table: 'only_updated_at',
			timestamps: {
				updatedAt: 'updated_at'
			}
		});
	});

	describe('finding by id', () => {
		it('success', async () => {
			const record = await helper_full.create({
				field: 'field'
			});

			const found = await helper_full.findById(record.id);

			expect(found.value)
				.toEqual(record);
		});

		it('fail', async () => {
			const found = await helper_full.findById('anyid');
			expect(found.isNone())
				.toBeTruthy();
		});
	});

	describe('finding one', () => {
		it('success', async () => {
			await helper_full.create({
				field: 'field'
			});

			const record2 = await helper_full.create({
				field: 'field2'
			});

			const found = await helper_full.findOne({field: record2.field});

			expect(found.value)
				.toEqual(record2);
		});

		it('fail', async () => {
			const found = await helper_full.findOne({field: 'some'});
			expect(found.isNone())
				.toBeTruthy();
		});
	});

	describe('deleting', () => {
		it('removing existing', async () => {
			const record = await helper_full.create({
				field: 'field'
			});

			await helper_full.deleteById(record.id);

			const found = await helper_full.findById(record.id);
			expect(found.isNone())
				.toBeTruthy();
		});


		it('removing non-existing', async () => {
			const record = await helper_full.create({
				field: 'field'
			});

			await helper_full.deleteById(record.id);
			// call twice
			await helper_full.deleteById(record.id);

			const found = await helper_full.findById(record.id);
			expect(found.isNone())
				.toBeTruthy();
		});
	});

	describe('creating', () => {
		it('with all dates', async () => {
			const record = await helper_full.create({
				field: 'field'
			});

			expect(record)
				.toMatchSnapshot({
					id: expect.stringMatching(/^.{26}$/),
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date)
				});
		});

		it('with create date only', async () => {
			const record = await helper_onlyCreatedAt.create({
				field: 'field'
			});

			expect(record)
				.toMatchSnapshot({
					id: expect.stringMatching(/^.{26}$/),
					createdAt: expect.any(Date)
				});
		});

		it('with update date only', async () => {
			const record = await helper_onlyUpdatedAt.create({
				field: 'field'
			});

			expect(record)
				.toMatchSnapshot({
					id: expect.stringMatching(/^.{26}$/),
					updatedAt: expect.any(Date)
				});
		});
	});

	describe('updating', () => {
		it('with all dates', async () => {
			const record = await helper_full.create({
				field: 'field'
			});

			await helper_full.updateById(record.id, {
				field: 'field2'
			});

			const found = await helper_full.findById(record.id);

			expect(found.value)
				.toHaveProperty('field', 'field2');
			expect(found.value!.updatedAt)
				.toBeAfter(record.updatedAt);
		});

		it('with created date only', async () => {
			const record = await helper_onlyCreatedAt.create({
				field: 'field'
			});

			await helper_onlyCreatedAt.updateById(record.id, {
				field: 'field2'
			});

			const found = await helper_onlyCreatedAt.findById(record.id);
			expect(found.value)
				.not
				.toHaveProperty('updatedAt');
		});

		it('with update date only', async () => {
			const record = await helper_onlyUpdatedAt.create({
				field: 'field'
			});

			await helper_onlyUpdatedAt.updateById(record.id, {
				field: 'field2'
			});

			const found = await helper_onlyUpdatedAt.findById(record.id);

			expect(found.value)
				.toHaveProperty('field', 'field2');

			if (found.isNone()) {
				throw new Error('Not `just`');
			}
			expect(found.value.updatedAt)
				.toBeAfter(record.updatedAt);
		});
	})
});
