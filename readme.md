## Ingestion Process

[![codecov](https://codecov.io/gh/techsavvyash/cQube-ingestion/branch/update/graph/badge.svg?token=B9NSK3JR4C)](https://codecov.io/gh/techsavvyash/cQube-ingestion)
[![Node.js CI](https://github.com/ChakshuGautam/cqube-ingestion/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/ChakshuGautam/cqube-ingestion/actions/workflows/ci.yml)

### Documentation

![cQube-LLD-Parser drawio](https://github.com/ChakshuGautam/cQube-POCs/assets/67280631/7e2a95e9-29d7-4187-b101-74c2a785105a)

The above diagram shows the low level diagram of the data ingestion process in cQube.
cQube accepts data in the form of CSVs, these CSVs are required to follow set and strict rules of naming conventions. These CSVs are then processed to create the processable JSON schemas out of the CSV data. These JSONs are then processed to generate the various datasets insert data into those datasets.
If we go flow wise as shown in the diagram, we get the CSV files which are presently stored in the `/ingest` folder. There are two types of data files:

1. **Dimension files**: These define the dimensions that act as the atomic building blocks for the actual dataset files. For example: District ids, school ids, etc.
2. **Event files**: These contain the actual data that is aggregated and stored into the tables.

Both of these types of files further have two types:

1. **Grammar files**: These file define the schema of the table to be created when ingesting the data present in the corresponding data file.
2. **Data files**: These files contain the actual data that needs to be ingested.

Below diagram shows the correlation between the types of CSVs and the final table that is created.
Each event file has data that combines various dimensions and time dimensions together, these files are read and processed and accordingly different datasets are created for a single event file based on the number of time dimensions and dimensions and their combinations, we have the option to define which compound datasets (combinations of more than one dimensions) to be created and also to specify which dimension to not be converted to a data, via the `whitelisted` and `blacklisted` options in the config file.

![cQube-CSV-Ingestion drawio](https://github.com/ChakshuGautam/cQube-POCs/assets/67280631/badf95b8-c1c6-4485-bdf9-74ce0c550e74)

## References

To learn more about cQube you can refer to the following links:

- [cQube microsite](https://cqube.sunbird.org)
- [cQube Design Doc](https://docs.google.com/document/d/1BWyabCuqHYFxG0RuV3wi9kfkEL-9VlsCvdKtZgTiqks/edit?usp=sharing)
- [Code walkthrough and sample demo video link]()
