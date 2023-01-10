import { Injectable } from '@nestjs/common';
import { Event } from './types/event';

@Injectable()
export class AppService {
  createKPI(): string {
    return 'KPI created';
  }

  setup(): void {
    // 1. Create a new Dimension for School
    // 2. Create a new KPI for School Attendance Bar Chart
    // 3. Create a grammer for Dataset => Creates a tables and indexes
    // 4. Create a grammer for Event
    // 5. Create a Transformer
    // 6. Create a Pipe
  }

  flow(event: Event): void { }

  // TODO: on the Flows
  // 1. Create a new Dimension for School
  // 2. Create a new KPI for School Attendance Bar Chart
  // 3. Create a grammer for Dataset => Creates a tables and indexes
  // 4. Create a grammer for Event
  // 5. Create a Transformer
  // 6. Create a Pipe
  // 7. Push and event to the pipe
  // 8. Capture the event and transform it to a dataset using a transformer

  // TODO: Managing Postgres queries through say a Prisma and get the schema verified.
  // TODO: Converting JSONSchema to PSQL Query to create a table
  // TODO: Adding indexes to the tables using the Dimensions and Dateset Schemas

  // TODO: on the tables that need to be created
  // 1. Create tables for Grammars => DimensionsGrammar, DatasetGrammar, EventGrammar (One method for each of them)
  // 2. Create tables for Entties => Dimension, Dataset

  // TODO:: Testing the flow
}
