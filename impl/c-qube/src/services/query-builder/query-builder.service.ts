import { Injectable } from '@nestjs/common';
import { JSONSchema4 } from 'json-schema';
import { QueryBuilderSchema } from './types/QueryBuilderSchema';
import { UpdateStatementData } from './types/UpdateStatementData';

type fk = {
  column: string;
  reference: {
    table: string;
    column: string;
  };
};

@Injectable()
export class QueryBuilderService {
  constructor() {}

  cleanStatement(statement: string): string {
    return (
      statement
        .replace(/^[ ]+|[ ]+$/g, '')
        // Due to BAD data in CSV files, this might fail so commented out
        // .replace(/\s\s+/g, ' ')
        .replace(/\n/g, '')
        .replace(/\(\s+/g, '(')
        .replace(/\,\s+/g, ', ')
        .replace(/\s+\)/g, ')')
    );
  }

  addFKConstraintDuringCreation(
    schema: JSONSchema4 | QueryBuilderSchema,
    createStatement: string,
  ): string {
    createStatement = this.cleanStatement(createStatement);
    const fkStatements = schema.fk.map((fk: fk) => {
      let referenceField = `${fk.reference.table}(name)`;
      if (fk.reference.column) {
        referenceField = `${fk.reference.table}(${fk.reference.column})`;
      }
      return `constraint fk_${fk.column} FOREIGN KEY (${fk.column}) REFERENCES ${referenceField}`; //TODO: Should be the FK
    });
    createStatement = createStatement.replace(');', ',');
    createStatement += fkStatements.join(',\n');
    createStatement += ');';
    return this.cleanStatement(createStatement);
  }

  generateCreateStatement(
    schema: JSONSchema4 | QueryBuilderSchema,
    autoPrimaryKey = false,
  ): string {
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const primaryKeySegment = autoPrimaryKey ? '\n id SERIAL PRIMARY KEY,' : '';
    let createStatement = `CREATE TABLE ${psqlSchema}.${tableName} (${primaryKeySegment}\n`;

    const properties = schema.properties;
    for (const property in properties) {
      const column = properties[property];
      createStatement += `  ${property} `;
      if (column.type === 'string' && column.format === 'date-time') {
        createStatement += 'TIMESTAMP';
      } else if (column.type === 'string' && column.format === 'date') {
        createStatement += `DATE`;
      } else if (
        column.type === 'number' &&
        (column.format === 'float' || column.format === 'double')
      ) {
        createStatement += 'FLOAT8';
      } else if (column.type === 'integer') {
        createStatement += `integer`;
      } else if (column.type === 'string') {
        createStatement += `VARCHAR`;
      } else {
        console.error('unssuported column.type', column.type);
        // type not supported
      }
      if (column.type === 'string' && column.maxLength) {
        createStatement += `(${column.maxLength})`;
      }
      if (column.type === 'string' && column.unique) {
        createStatement += ` UNIQUE`;
      }
      createStatement += ',\n';
    }

    createStatement = createStatement.slice(0, -2); // remove last comma and newline
    createStatement += '\n);';

    if (schema.fk !== undefined) {
      createStatement = this.addFKConstraintDuringCreation(
        schema,
        createStatement,
      );
    }
    return this.cleanStatement(createStatement);
  }

  generateIndexStatement(
    schema: JSONSchema4 | QueryBuilderSchema,
  ): string[] | null {
    const psqlSchema = schema.psql_schema;
    const indexStatements = [];
    if (schema.indexes) {
      const indexes = schema.indexes;

      for (const index of indexes) {
        for (const column of index.columns) {
          const indexName = `${schema.title}_${column.join('_')}_idx`;
          const columns = column.join(', ');
          const statement = `CREATE INDEX ${indexName} ON ${psqlSchema}.${schema.title} (${columns});`;
          indexStatements.push(statement);
        }
      }
    }
    return indexStatements.map((statement) => this.cleanStatement(statement));
  }

  generateInsertStatement(
    schema: JSONSchema4 | QueryBuilderSchema,
    data: any,
  ): string {
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const fields = [];
    const values = [];

    const propertiesToSkip = ['id'];

    const properties = schema.properties;
    for (const property in properties) {
      if (propertiesToSkip.includes(property)) continue;
      fields.push(property);
      values.push(`'${data[property]}'`);
    }

    const query = `INSERT INTO ${psqlSchema}.${tableName} (${fields.join(
      ', ',
    )}) VALUES (${values.join(', ')});`;
    return this.cleanStatement(query);
  }

  generateBulkInsertStatement(
    schema: JSONSchema4 | QueryBuilderSchema,
    data: any[],
  ): string {
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;
    const fields = [];
    const values = [];

    const propertiesToSkip = ['id'];

    const properties = schema.properties;
    for (const property in properties) {
      if (propertiesToSkip.includes(property)) continue;
      fields.push(property);
    }

    for (const row of data) {
      const rowValues = [];
      for (const property in properties) {
        if (propertiesToSkip.includes(property)) continue;
        if (
          schema.properties[property].type === 'string' &&
          schema.properties[property].format === 'date'
        ) {
          rowValues.push(`'${row[property].toISOString()}'`);
        } else {
          rowValues.push(`'${row[property]}'`);
        }
      }
      values.push(`(${rowValues.join(', ')})`);
    }

    const query = `INSERT INTO ${psqlSchema}.${tableName} (${fields.join(
      ', ',
    )}) VALUES ${values.join(', ')};`;
    return this.cleanStatement(query);
  }

  generateUpdateStatement(
    schema: JSONSchema4 | QueryBuilderSchema,
    data: UpdateStatementData,
  ): string {
    const tableName = schema.title;
    const psqlSchema = schema.psql_schema;

    // check if the keys of data.properties and data.conditions are a subset of schema.properties or not
    const schemaPropertiesSet = new Set(Object.keys(schema.properties));
    const dataPropertiesSet = new Set(Object.keys(data.properties));
    const conditionPropertiesSet = new Set(Object.keys(data.conditions));

    const dataPropIntersection = new Set();
    const conditionPropIntersection = new Set();
    for (const schemaProp of schemaPropertiesSet) {
      if (dataPropertiesSet.has(schemaProp))
        dataPropIntersection.add(schemaProp);
      if (conditionPropertiesSet.has(schemaProp))
        conditionPropIntersection.add(schemaProp);
    }

    if (
      dataPropIntersection.size !== dataPropertiesSet.size ||
      conditionPropIntersection.size !== conditionPropertiesSet.size
    ) {
      throw new Error(
        `The properties of the update statement are not a subset of the schema properties`,
      );
    }

    let query = `UPDATE ${psqlSchema}.${tableName} SET `;
    for (const key in data.properties) {
      const type = schema.properties[key].type;
      const value = data.properties[key].value;
      query += `${key} = ${type === 'string' ? "'" + value + "'" : value}, `;
    }
    query = query.slice(0, -2); // remove last comma and space

    const conditions = Object.keys(data.conditions);
    console.log('conditions: ', conditions);
    if (conditions.length > 0) {
      query += ' WHERE ';

      conditions.forEach((condition) => {
        const op = data.conditions[condition].operator;
        const type = data.conditions[condition].type;
        const value = data.conditions[condition].value;
        query += `${condition} ${op} ${type === 'number' || type === 'boolean' ? value : "'" + value + "'"
          } and `;
      });
      query = query.slice(0, -5); // remove last 'and' and space
    }

    query += ';';

    return query;
  }
}
