import { Test, TestingModule } from '@nestjs/testing';
import { JSONSchema4 } from 'json-schema';
import { QueryBuilderService } from './query-builder.service';

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

  it('generates a create statement with a string and integer', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n id integer,\n  name VARCHAR(255)\n);',
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

  it('generates a create statement with multiple columns with Date', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id integer,\n  name VARCHAR(255),\n  date_created DATE\n);',
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

  it('generates a create statement with a float and string', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'number', format: 'double' },
        name: { type: 'string'}
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
        'CREATE TABLE my_schema.my_table (\n  id FLOAT8,\n name VARCHAR \n);',
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

  it('generates a create statement with a unique string', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string', unique: 'DISTINCT' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n name VARCHAR UNIQUE\n);',
      ),
    );
  });


  it('generates a create statement with a unique string of maximum length', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string', maxLength: 255, unique:'DISTINCT'},      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n name VARCHAR(255) UNIQUE\n);',
      ),
    );
  });

  it('generates a create statement with an integer and a unique string', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: {type:'integer'},
        name: { type: 'string', unique:'DISTINCT'},      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n id integer, \n name VARCHAR UNIQUE \n);',
      ),
    );
  });

  it('generates a create statement with a date-time and unique string', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        date_created: { type: 'string', format: 'date-time' },
        name: { type: 'string', unique:'DISTINCT'},      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n date_created TIMESTAMP, \n name VARCHAR UNIQUE \n);',
      ),
    );
  });

  it('generates a create statement with a unique date-time', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        date_created: { type: 'string', unique:'DISTINCT', format: 'date-time' },
     },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n date_created TIMESTAMP UNIQUE \n);',
      ),
    );
  });

  it('generates a create statement with a unique date', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        date_created: { type: 'string', unique:'DISTINCT', format: 'date' },
     },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n date_created DATE UNIQUE \n);',
      ),
    );
  });

  it('generates a create statement with a unique date and string', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        date_created: { type: 'string', unique:'DISTINCT', format: 'date' },
        name:{ type:'string', unique:'DISTINCT'},
     },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n date_created DATE UNIQUE,\n name VARCHAR UNIQUE \n);',
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
});
