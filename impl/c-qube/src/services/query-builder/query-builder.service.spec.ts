import { Test, TestingModule } from '@nestjs/testing';
import { JSONSchema4 } from 'json-schema';
import { QueryBuilderService } from './query-builder.service';
import { QueryBuilderSchema } from '../../types/QueryBuilderSchema';
import { UpdateStatementData } from '../../types/UpdateStatementData';

describe('QueryBuilderService', () => {
  let service: QueryBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService],
    }).compile();

    service = module.get<QueryBuilderService>(QueryBuilderService);
  });

  it('generates a create statement with a single integer column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
      false,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id integer\n);',
      ),
    );
  });

  it('generates a create statement with a single string column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  name VARCHAR\n);',
      ),
    );
  });

  it('generates a create statement with a string column with a max length', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string', maxLength: 255 },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  name VARCHAR(255)\n);',
      ),
    );
  });

  it('generates a create statement with multiple columns with Timestamps', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id integer,\n  name VARCHAR(255),\n  date_created TIMESTAMP\n);',
      ),
    );
  });

  it('generates a create statement with a single float column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'number', format: 'float' },
      },
      indexes: [
        {
          name: 'my_table_id_idx',
          columns: ['id'],
        },
      ],
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id FLOAT8\n);',
      ),
    );
  });

  it('generates a create statement with a single double column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'number', format: 'double' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id FLOAT8\n);',
      ),
    );
  });

  it('generates an index statement for each index defined in the schema', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [{ columns: [['name']] }, { columns: [['date_created']] }],
    };
    const indexStatements: string[] = service.generateIndexStatement(
      jsonSchema as JSONSchema4,
    );
    const expectedStatements: string[] = [
      `CREATE INDEX my_table_name_idx ON my_schema.my_table (name);`,
      `CREATE INDEX my_table_date_created_idx ON my_schema.my_table (date_created);`,
    ].map(service.cleanStatement);
    expect(indexStatements.sort()).toEqual(expectedStatements.sort());
  });

  it('generates an index statement for each index defined in the schema', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const indexStatements: string[] = service.generateIndexStatement(
      jsonSchema as JSONSchema4,
    );
    const expectedStatements: string[] = [
      `CREATE INDEX my_table_name_date_created_idx ON my_schema.my_table (name, date_created);`,
      `CREATE INDEX my_table_name_idx ON my_schema.my_table (name);`,
      `CREATE INDEX my_table_date_created_idx ON my_schema.my_table (date_created);`,
    ];
    expect(indexStatements.sort()).toEqual(expectedStatements.sort());
  });

  it('generates a insert statement', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };

    const dataForJSONSchema = {
      name: 'test',
      date_created: '2020-01-01T00:00:00.000Z',
    };

    const insertStatement = service.generateInsertStatement(
      jsonSchema as JSONSchema4,
      dataForJSONSchema,
    );

    expect(insertStatement).toBe(
      service.cleanStatement(
        `INSERT INTO my_schema.my_table (name, date_created) VALUES ('test', '2020-01-01T00:00:00.000Z');`,
      ),
    );
  });

  it('generates a "Create" statement with ID as primary key', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };

    const insertStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
      true,
    );

    expect(insertStatement).toBe(
      service.cleanStatement(`CREATE TABLE my_schema.my_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        date_created TIMESTAMP
      );`),
    );
  });

  it('generates a "Update" statement with where condition value as string', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
        date_updated: { type: 'string', format: 'date-time' },
        isAdult: { type: 'string', maxLength: 1 },
        age: { type: 'number' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const data: UpdateStatementData = {
      properties: {
        isAdult: {
          type: 'string',
          value: 'Y',
        },
        date_updated: {
          type: 'string',
          value: '2023-03-10T15:52:22.418Z',
        },
      },
      conditions: {
        age: {
          operator: '>=',
          type: 'string',
          value: '18',
        },
      },
    };

    const updateStatement = service.generateUpdateStatement(
      jsonSchema as JSONSchema4 | QueryBuilderSchema,
      data,
    );

    expect(updateStatement).toBe(
      service.cleanStatement(
        `UPDATE my_schema.my_table SET isAdult = 'Y', date_updated = '2023-03-10T15:52:22.418Z' WHERE age >= '18';`,
      ),
    );
  });

  it('generates a "Update" statement with where condition value as number', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
        date_updated: { type: 'string', format: 'date-time' },
        isAdult: { type: 'string', maxLength: 1 },
        age: { type: 'number' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const data: UpdateStatementData = {
      properties: {
        isAdult: {
          type: 'string',
          value: 'Y',
        },
        date_updated: {
          type: 'string',
          value: '2023-03-10T15:52:22.418Z',
        },
      },
      conditions: {
        age: {
          operator: '>',
          type: 'number',
          value: '18',
        },
      },
    };

    const updateStatement = service.generateUpdateStatement(
      jsonSchema as JSONSchema4 | QueryBuilderSchema,
      data,
    );

    expect(updateStatement).toBe(
      service.cleanStatement(
        `UPDATE my_schema.my_table SET isAdult = 'Y', date_updated = '2023-03-10T15:52:22.418Z' WHERE age > 18;`,
      ),
    );
  });

  it('generates a "Update" statement with where condition value as boolean', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
        date_updated: { type: 'string', format: 'date-time' },
        isAdult: { type: 'string', maxLength: 1 },
        someRandomIndicator: { type: 'boolean' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const data: UpdateStatementData = {
      properties: {
        isAdult: {
          type: 'string',
          value: 'Y',
        },
        date_updated: {
          type: 'string',
          value: '2023-03-10T15:52:22.418Z',
        },
      },
      conditions: {
        someRandomIndicator: {
          operator: '=',
          type: 'boolean',
          value: false as boolean,
        },
      },
    };

    const updateStatement = service.generateUpdateStatement(
      jsonSchema as JSONSchema4 | QueryBuilderSchema,
      data,
    );

    expect(updateStatement).toBe(
      service.cleanStatement(
        `UPDATE my_schema.my_table SET isAdult = 'Y', date_updated = '2023-03-10T15:52:22.418Z' WHERE someRandomIndicator = false;`,
      ),
    );
  });

  it('generates a "Update" statement without a WHERE clause', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
        date_updated: { type: 'string', format: 'date-time' },
        isAdult: { type: 'string', maxLength: 1 },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const data: UpdateStatementData = {
      properties: {
        isAdult: {
          type: 'string',
          value: 'Y',
        },
        date_updated: {
          type: 'string',
          value: '2023-03-10T15:52:22.418Z',
        },
      },
      conditions: {},
    };

    const updateStatement = service.generateUpdateStatement(
      jsonSchema as JSONSchema4 | QueryBuilderSchema,
      data,
    );

    expect(updateStatement).toBe(
      service.cleanStatement(
        `UPDATE my_schema.my_table SET isAdult = 'Y', date_updated = '2023-03-10T15:52:22.418Z';`,
      ),
    );
  });

  it('generates a "Update" statement with multiple update conditions', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
        date_updated: { type: 'string', format: 'date-time' },
        isAdult: { type: 'string', maxLength: 1 },
        someRandomIndicator: { type: 'boolean' },
        age: { type: 'number' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const data: UpdateStatementData = {
      properties: {
        isAdult: {
          type: 'string',
          value: 'Y',
        },
        date_updated: {
          type: 'string',
          value: '2023-03-10T15:52:22.418Z',
        },
      },
      conditions: {
        age: {
          operator: '>',
          type: 'number',
          value: '18',
        },
        someRandomIndicator: {
          operator: '=',
          type: 'boolean',
          value: true,
        },
      },
    };

    const updateStatement = service.generateUpdateStatement(
      jsonSchema as JSONSchema4 | QueryBuilderSchema,
      data,
    );

    expect(updateStatement).toBe(
      service.cleanStatement(
        `UPDATE my_schema.my_table SET isAdult = 'Y', date_updated = '2023-03-10T15:52:22.418Z' WHERE age > 18 and someRandomIndicator = true;`,
      ),
    );
  });

  it('throws because of wrong properties', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
        someRandomIndicator: { type: 'boolean' },
        age: { type: 'number' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const data: UpdateStatementData = {
      properties: {
        isAdult: {
          type: 'string',
          value: 'Y',
        },
        date_updated: {
          type: 'string',
          value: '2023-03-10T15:52:22.418Z',
        },
      },
      conditions: {
        age: {
          operator: '>',
          type: 'number',
          value: '18',
        },
        someRandomIndicator: {
          operator: '=',
          type: 'boolean',
          value: true,
        },
      },
    };

    try {
      const updateStatement = service.generateUpdateStatement(
        jsonSchema as JSONSchema4 | QueryBuilderSchema,
        data,
      );
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe(
        'The properties of the update statement are not a subset of the schema properties',
      );
    }
  });

  it('throws because of wrong condition properties', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
        date_updated: { type: 'string', format: 'date-time' },
        isAdult: { type: 'string', maxLength: 1 },
        someRandomIndicator: { type: 'boolean' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const data: UpdateStatementData = {
      properties: {
        isAdult: {
          type: 'string',
          value: 'Y',
        },
        date_updated: {
          type: 'string',
          value: '2023-03-10T15:52:22.418Z',
        },
      },
      conditions: {
        age: {
          operator: '>',
          type: 'number',
          value: '18',
        },
        someRandomIndicator: {
          operator: '=',
          type: 'boolean',
          value: true,
        },
      },
    };

    try {
      const updateStatement = service.generateUpdateStatement(
        jsonSchema as JSONSchema4 | QueryBuilderSchema,
        data,
      );
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe(
        'The properties of the update statement are not a subset of the schema properties',
      );
    }
  });
});
