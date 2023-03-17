## Schema Onboarding and Ingestion
0. Config Parser
  - Define types for a config
  - Verify if a config is correct on not using Zod
  - Verify if the file names are in the correct format using the folder mentioned in the config
  - Verify if the namespaces and folder details are in the right format
  - Check for spelling errors
    - Suggest incorrect configurations/spellings
  - Suggest in case of unused configurations
  - Error Handling
    - Raise Issues when this doesn't happen
    - Defined Errors with Codes
  - Add a config to silent the errors and report it at the end for incorrect configurations
1. CSV Format Definition as Types
  - Dimension
  - Event
  - Dimension Data
  - Event Data
  - Check the validity of Blacklisted and Whitelisted Dimension combinations
2. CSV Reader Utilities
  - Ability to read CSV and check if the format is correct or not
  - Load the CSV Data using the Types defined in 1
  - Error Handling
    - Raise Issues when this doesn't happen
    - Defined Errors with Codes
  - Loading and Verifying data based on the schema
    - Ability to load data files using a dataframe
    - Ability to verify data formats using a dataframe
    - Ability to filter null, NA, empty values
3. Validate Event Grammar to Dimension Grammar Mapping
  - A comprehensive test suite to test out all the fields in Event getting mapped to a dimension and non dimesnion
  - Error Handling
    - Raise Issues when this doesn't happen
    - Defined Errors with Codes
4. CSV Format to Dimension Grammar Generator
  - Ability to generate Ajv Schema as well
  - Ability to generate types directly
5. CSV Format to Event Grammar Generator
  - Ability to generate Ajv Schema as well
  - Ability to generate types directly
6. Manage a Global State of steps at which the parer is at
  - Steps 
    - 1/N for expected Dimension, Events and Dataset Grammars to be ingested
    - 1/N for expected Dimension and Dataset Data to be ingested
    - 1/N for global steps that need to be done for total ingested data
    - Global list of things that need to be done
7. Ability to pause and resume and the schema ingestion pipeline

## Query Builder
1. Ability to manage retries
2. Adapter approach to connect to other databases.