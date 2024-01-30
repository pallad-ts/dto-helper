import {Knex} from 'knex';
import {Mapper} from '@pallad/mapper';
import {ID, create} from "@pallad/id";
import {fromNullable, Maybe} from "@sweet-monads/maybe";

export class RDBMSHelper<T, TID extends Knex.Value> {
	constructor(private knex: Knex, private options: RDBMSHelper.Options<T, TID>) {
		this.options = {
			timestamps: {
				createdAt: 'created_at',
				updatedAt: 'updated_at'
			},
			...this.options,
		};
	}

	createQueryBuilder() {
		return this.knex(this.options.table);
	}

	async findById(id: string): Promise<Maybe<T>> {
		return this.findOne({id});
	}

	async findOne(query: any): Promise<Maybe<T>> {
		return fromNullable(
			await this.createQueryBuilder()
				.where(query)
				.first()
				.then((result: any) => {
					// eslint-disable-next-line no-null/no-null
					if (result === null || result === undefined) {
						return undefined;
					}
					return this.options.mapper.mapToLight(result);
				})
		);
	}

	async find(query: any): Promise<T[]> {
		return this.createQueryBuilder()
			.where(query)
			.then((result: any[]) => {
				return this.options.mapper.arrayMapToLight(result);
			})
	}

	async findByQueryBuilder(func: RDBMSHelper.QueryBuilderModifier): Promise<T[]> {
		const qb = this.createQueryBuilder();
		func(qb);
		return this.options.mapper.arrayMapToLight(await qb);
	}

	async findOneByQueryBuilder(func: (builder: Knex.QueryBuilder<any, any>) => Knex.QueryBuilder<any, any>): Promise<Maybe<T>> {
		const qb = this.createQueryBuilder();
		func(qb);
		return fromNullable(
			await qb
				.first()
				.then((result: any) => {
					// eslint-disable-next-line no-null/no-null
					if (result === null || result === undefined) {
						return undefined;
					}
					return this.options.mapper.mapToLight(result);
				})
		);
	}

	private get mapper() {
		return this.options.mapper;
	}

	async create<TInput>(input: TInput) {
		const id = this.options.idGenerator();

		const data = this.mapper.mapPartialToDark({id, ...input} as any);
		const returning = [];
		if (this.options.timestamps && this.options.timestamps.createdAt) {
			returning.push(this.options.timestamps.createdAt);
		}
		if (this.options.timestamps && this.options.timestamps.updatedAt) {
			returning.push(this.options.timestamps.updatedAt);
		}

		const saveResult = await this.createQueryBuilder()
			.insert(data, returning);

		return this.mapper.mapToLight({
			...data,
			id,
			...(saveResult[0] || {})
		});
	}


	async update<TInput>(input: TInput, modifier: RDBMSHelper.QueryBuilderModifier) {
		const data = this.options.mapper.mapPartialToDark(input as any);
		if (this.options.timestamps && this.options.timestamps.updatedAt) {
			data[this.options.timestamps.updatedAt] = this.knex.fn.now(3);
		}
		const qb = this.createQueryBuilder()
			.update(data);

		modifier(qb);
		await qb;
	}

	updateById<TInput>(id: TID, input: TInput, modifier?: RDBMSHelper.QueryBuilderModifier) {
		return this.update(input, qb => {
			qb.where('id', id);
			modifier && modifier(qb);
		});
	}

	async delete(modifier: RDBMSHelper.QueryBuilderModifier) {
		const qb = this.createQueryBuilder()
			.delete();

		modifier(qb);

		await qb;
	}

	deleteById(id: TID, modifier?: RDBMSHelper.QueryBuilderModifier) {
		return this.delete(qb => {
			modifier && modifier(qb);
			qb.where('id', id)
		});
	}

	static createStandard<T>(knex: Knex, options: RDBMSHelper.StandardOptions<T>) {
		const timestamps: RDBMSHelper.Timestamps = {};
		if (options.withCreatedAt ?? true) {
			timestamps.createdAt = options.mapper.getDarkNameFromLightName('createdAt' as any) as string;
		}
		if (options.withUpdatedAt ?? true) {
			timestamps.updatedAt = options.mapper.getDarkNameFromLightName('updatedAt' as any) as string;
		}

		return new RDBMSHelper(knex, {
			table: options.table,
			mapper: options.mapper,
			idGenerator: create,
			timestamps
		});
	}
}

export namespace RDBMSHelper {
	export interface Options<T, TID> {
		table: string;
		mapper: Mapper<T>;
		idGenerator: () => TID,
		timestamps?: Timestamps;
	}

	export interface Timestamps {
		createdAt?: string,
		updatedAt?: string
	}

	export interface StandardOptions<T> extends Pick<Options<T, ID>, 'table' | 'mapper'> {
		withCreatedAt?: boolean;
		withUpdatedAt?: boolean;
	}

	export type QueryBuilderModifier = (knex: Knex.QueryBuilder) => void;
}
