# Override global config by program config if available

## Description

Presently only the global config.json at the ingest folder level is respected, whereas this global config.json should be overridden in case a `config.json` is present at a program level.
Original ingest function ( where modifications are to be performed )-

```typescript
public async ingest(
    ingestionFolder = './ingest',
    ingestionConfigFileName = 'config.json',
  ) {
    const s = spinner();
    s.start('🚧 1. Deleting Old Data');
    await this.nuke();
    s.stop('✅ 1. The Data has been Nuked');

    let datasetGrammarsGlobal: DatasetGrammar[] = [];

    // Parse the config
    s.start('🚧 2. Reading your config');
    // const ingestionFolder = './ingest';
    const config = JSON.parse(
      await readFile(ingestionFolder + '/' + ingestionConfigFileName, 'utf8'),
    );
    const regexEventGrammar = /\-event\.grammar.csv$/i;
    const defaultTimeDimensions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    s.stop('✅ 2. Config parsing completed');

```

## Goals

The goal to achieve is :

* Support for reading `config.json` created at a program level
* Using global config.json incase `program_config_file` is not defined 

## Implementation

To address this issue, I’m modifying the ingest function to include a for loop , iterating over programs and an if statement inside it to check if program-config exists .
The following is the updated code base to address the problem -

```typescript
public async ingest(
    ingestionFolder = './ingest',
    ingestionConfigFileName = 'config.json',
  ) {
    const s = spinner();
    s.start('🚧 1. Deleting Old Data');
    await this.nuke();
    s.stop('✅ 1. The Data has been Nuked');

    let datasetGrammarsGlobal: DatasetGrammar[] = [];

    // Parse the config
    s.start('🚧 2. Reading your config');
    // const ingestionFolder = './ingest';
    const config = JSON.parse(
      await readFile(ingestionFolder + '/' + ingestionConfigFileName, 'utf8'),
    );
    for (const program of config.programs) {
      const programConfigPath = `${ingestionFolder}/programs/${program.namespace}/${ingestionConfigFileName}`;
      
      if (fs1.existsSync(programConfigPath)) {
        const config = JSON.parse(await readFile(programConfigPath, 'utf8'));
        //This is parsing the program specific config
      } else {
        // This is using the global config for this program which has already been parsed above
      }
    }
    const regexEventGrammar = /\-event\.grammar.csv$/i;
    const defaultTimeDimensions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    s.stop('✅ 2. Config parsing completed');
```

In this , we’ve initially defined the config variable that takes the global config file under ingest . There is a FOR loop that is iterating over all the programs mentioned in the global config file . Inside it , I’ve created a `program_config_path` which creates a path to go inside the particular program at that instance .

Then inside the if statement it checks if there’s any file named config.json inside that particular program folder . If it exists , then the config variable (defined in the beginning) is overwritten and now it takes the config file of the program , rather than the global one.

## Conclusion

Incase for a particular program , if its config file is defined with the program folder than that file is taken into account and not the `global config.json` present in the ingest folder . However , for the programs which do not have their particular configs defined , `global config.json` is used as default . 
