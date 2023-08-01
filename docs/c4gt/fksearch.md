# Implementation of caseSenstiveFKSearch Issue in cQube

## Description

cQube allows users to specify data to be ingested using a `config.json` file. A new configuration parameter called `caseSenstiveFKSearch` is implemented. `caseSenstiveFKSearch` allows users to define whether the foreign key search should be case-sensitive or not during data ingestion for datasets. The default value of `caseSenstiveFKSearch` is `false`, which means that the foreign key search is case-sensitive.

## Changes Made

The following changes were made to implement the `caseSenstiveFKSearch` feature:

1. **Added `caseSenstiveFKSearch` parameter to `config.json`:** A new parameter called `caseSenstiveFKSearch` was added to the `globals` section of the `config.json` file. Users can specify the desired value for `caseSenstiveFKSearch` using this parameter. The updated `config.json` looks like this:

```json
{
  "globals": {
    "onlyCreateWhitelisted": true,
    "caseSensitiveFKSearch": false
  }
}
```

2. **Modified `FKvalue` function to use `caseSenstiveFKSearch`:** The `FKvalue` function was modified to read the `caseSensitiveFKSearch` value from the `config.json` file and use it in the foreign key search process. The `FKvalue` function now uses the obtained `caseSenstiveFKSearch` value during foreign key search. The modified `FKvalue` function looks like this:

```typescript
function FKvalue(configPath: string): boolean {
  const configContent = fs1.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  return config.globals && config.globals.caseSensitiveFKSearch ? config.globals.caseSensitiveFKSearch : false;
}
```

## Test Case Video

A test case video demonstrating the functionality of the `caseSenstiveFKSearch` parameter in cQube has been created. The video showcases the following steps:

1. Editing the `config.json` file to include the `caseSenstiveFKSearch` parameter.
2. Running the cQube application to ingest data with the specified `caseSenstiveFKSearch`.
3. Observing the data ingestion process, ensuring that the specified delimiter is used during CSV parsing.

**Link to Test Case Video:**
[Link to Test Case Video]

## Conclusion

The `caseSenstiveFKSearch` feature has been successfully implemented in cQube. Users can now specify whether the foreign key search should be case-sensitive or not during data ingestion for datasets. This will help to ensure that foreign keys are matched correctly, even if they are entered in different cases.