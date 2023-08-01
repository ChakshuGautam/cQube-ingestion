# Implementation of csvDelimeter Issue in cQube

## Description

cQube allows users to specify data to be ingested using a `config.json` file. A new configuration parameter called `csvDelimeter` is implemented. `csvDelimeter` allows users to define the CSV delimiter during data ingestion for datasets or dimensions. The default delimiter used in cQube is a comma.

## Changes Made

The following changes were made to implement the `csvDelimeter` feature:

1. **Added `csvDelimeter` parameter to `config.json`:** A new parameter called `csvDelimeter` was added to the `globals` section of the `config.json` file. Users can specify the desired delimiter using this parameter. The updated `config.json` looks like this:

```json
{
  "globals": {
    "onlyCreateWhitelisted": true,
    "csvDelimiter": "/"
  }
}
```

2. **Modified `getCsvDelimiter` function to use `csvDelimeter`:** The `getCsvDelimiter` function was modified to read the `csvDelimeter` value from the `config.json` file and use it in the CSV parsing process. The `getCsvDelimiter` function now uses the obtained `csvDelimeter` value during CSV parsing. The modified `getCsvDelimiter` function looks like this:

```typescript
function getCsvDelimiter(configPath: string): string {
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  return config.globals && config.globals.csvDelimeter ? config.globals.csvDelimeter : ',';
}
```


## Test Case Video

A test case video demonstrating the functionality of the `csvDelimeter` parameter in cQube has been created. The video showcases the following steps:

1. Editing the `config.json` file to include the `csvDelimeter` parameter.
2. Running the cQube application to ingest data with the specified `csvDelimeter`.
3. Observing the data ingestion process, ensuring that the specified delimiter is used during CSV parsing.

**Link to Test Case Video:**
[Link to Test Case Video]

## Conclusion

The `csvDelimeter` feature has been successfully implemented in cQube. Users can now specify the desired delimiter during data ingestion. This will help to ensure that CSV data is parsed correctly, even if it contains delimiter characters.



