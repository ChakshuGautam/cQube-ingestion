import { Injectable } from '@nestjs/common';
import { JSONSchema4 } from 'json-schema';
@Injectable()
export class QueryBuilderService {
  constructor() {}

  generateCreateStatement(jsonSchema: JSONSchema4) {
    const tableName = jsonSchema.title;
    let createStatement = `CREATE TABLE ${tableName} (\n`;

    const properties = jsonSchema.properties;
    for (const property in properties) {
      const column: JSONSchema4 = properties[property];
      createStatement += `  ${property} `;
      if (column.type === 'string' && column.format === 'date-time') {
        createStatement += 'TIMESTAMP';
      } else if (
        column.type === 'number' &&
        (column.format === 'float' || column.format === 'double')
      ) {
        createStatement += 'FLOAT8';
      } else {
        createStatement += `${column.type}`;
      }
      if (column.type === 'string' && column.maxLength) {
        createStatement += `(${column.maxLength})`;
      }
      createStatement += ',\n';
    }

    createStatement = createStatement.slice(0, -2); // remove last comma and newline
    createStatement += '\n);';

    return createStatement;
  }

  generateIndexStatement(schema: JSONSchema4): string | null {
    let indexStatements = '';
    if (schema.indexes) {
      const indexes = schema.indexes;

      for (const index of indexes) {
        for (const column of index.columns) {
          const indexName = `${schema.title}_${column.join('_')}_idx`;
          const columns = column.join(', ');
          const statement = `CREATE INDEX ${indexName} ON ${schema.title} (${columns});`;
          indexStatements += `${statement}\n`;
        }
      }
    }
    return indexStatements;
  }
}
