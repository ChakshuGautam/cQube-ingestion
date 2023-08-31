# Implementation of quoteChar Issue in cQube

## Description

cQube allows users to specify data to be ingested using a `config.json` file. A new configuration parameter called `quoteChar` is implemented. `quoteChar` allows users to define the CSV quote character during data ingestion for datasets or dimensions. The default quote character used in cQube is a single quote.

## Changes Made

The following changes were made to implement the `quoteChar` feature:

1. **Added `quoteChar` parameter to `config.json`:** A new parameter called `quoteChar` was added to the `globals` section of the `config.json` file. Users can specify the desired quote character using this parameter. The updated `config.json` looks like this:

```json
{
  "globals": {
    "onlyCreateWhitelisted": true,
    "quoteChar": "`"
  }
}
```

2. **Modified `readCSV` function to use `quoteChar`:** The `readCSV` function was modified to read the `quoteChar` value from the `config.json` file and use it in the CSV parsing process. The `getquoteChar` function was created to extract the `quoteChar` value from the `config.json` file. The `readCSV` function now uses the obtained `quoteChar` value during CSV parsing. The `getquoteChar` function looks like this:

```typescript
export function getquoteChar (configPath: string): string | undefined {
  try {
    const configContent = fs1.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config.globals.quoteChar;
  } catch (error) {
    return undefined;
  }
}
```

## Conclusion

The `quoteChar` feature has been successfully implemented in cQube. Users can now specify the desired quote character during data ingestion. This will help to ensure that CSV data is parsed correctly, even if it contains quote characters.


