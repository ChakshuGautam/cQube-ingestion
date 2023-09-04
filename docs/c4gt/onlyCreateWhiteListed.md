# Implementation of onlyCreateWhiteListed Parameter under the Global section 

## Description

cQube allows users to specify data to be ingested using a `config.json` file. A new configuration parameter called `onlyCreateWhiteListed` is implemented. `onlyCreateWhiteListed` ensures that only the datasets with matching names are created when ingesting schema. Whitelisted combinations for various programs are mentioned in the `config.json` file under the ingest folder .

## Goals

The goal to achieve is :

* Implement the `onlyCreateWhiteListed` parameter in the globals section of config.json.
* Coreect dataset ingestion as per whitelisted norms . 


## Implementation

The following changes were made to implement the `onlyCreateWhiteListed` feature:

1. **Modified `createDataset` function to implement `onlyCreateWhitelisted` logic:** The `createDataset` function was modified to call the `whitelistedMatching` function. The `whitelistedMatching` function was created to match the program names with the whitelisted combinations defined in the config.json .The `whitelistedMatching` function looks like this:

```typescript
async whitelistedMatching(datasetGrammar: DatasetGrammar): Promise<boolean> {
    const configContent = fs.readFileSync('ingest/config.json', 'utf-8');
    const config = JSON.parse(configContent);
    const onlyCreateWhitelisted = await this.getonlyCreateWhitelisted('ingest/config.json');

    if (onlyCreateWhitelisted) {
      const whitelistedCombinations = config.programs
        .flatMap((program) => program.dimensions.whitelisted);

      const isWhitelisted = whitelistedCombinations.some((combination) => {
        const dimensionNames = combination.split(',');
        return dimensionNames.every((dimension) => datasetGrammar.name.includes(dimension));
      });

      return isWhitelisted;
    }

    return false;
  }
```

2. **Created `getonlyCreateWhitelisted` function to use `onlyCreateWhitelisted` value from `config.json`:** The `createDataset` function was modified to read the `onlyCreateWhitelisted` value from the `config.json` file and use it in the dataset creation. The `getonlyCreateWhitelisted` function was created to extract the `onlyCreateWhitelisted` value from the `config.json` file. The `createDataset` function now uses the obtained `onlyCreateWhitelisted` value during dataset creation . The `getonlyCreateWhitelisted` function looks like this:

```typescript
 getonlyCreateWhitelisted(configPath: string): Promise<boolean> {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config.globals.onlyCreateWhitelisted ;
  } 
```

## Conclusion

The `quoteChar` feature has been successfully implemented in the dataset service . Users can now specify in the config file whether they want to create only the whitelisted dataset combinations mentioned or all of them during ingestion. 