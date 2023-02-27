import { Injectable } from '@nestjs/common';

@Injectable()
export class VizService {
  // -----------------------------
  // @chakshu
  // Setup a DB on the server where Metabase is deployed
  // Run ingest script to create DB and tables
  // Ingest Data
  // Manually create charts for the viz
  // Download the dashboard, card as a config file - JSON
  // -----------------------------
  // @Shurti and @Abhishek
  // Figure out the minimal Data needed to create a Chart - for all three chart types.
  // Create methods to create chart types (Spec complete) - Chakshu, Shruti and Abhishek to pick one.
  // -----------------------------
  // @All
  // Create cards on Metabase using tests
  // Add a config file into - KPI.config.json
  // Ingest the KPI.config.json to create dashboards directly
  // Update the Ingest method to create charts when the ingest script is run
  // -----------------------------
  // Crate a wrapper that embeds the dashboard into a simple CRA
}
