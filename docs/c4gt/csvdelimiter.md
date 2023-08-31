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
export function getCsvDelimiter(configPath: string): string | undefined {
  try {
    const configContent = fs1.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config.globals.csvDelimiter;
  } catch (error) {
    return undefined;
  }
}
```

## Conclusion

The `csvDelimeter` feature has been successfully implemented in cQube. Users can now specify the desired delimiter during data ingestion. This will help to ensure that CSV data is parsed correctly, even if it contains delimiter characters.



