[![Node.js CI](https://github.com/ChakshuGautam/cQube-POCs/actions/workflows/ci.yml/badge.svg)](https://github.com/ChakshuGautam/cQube-POCs/actions/workflows/ci.yml)

[![Coverage Status](https://coveralls.io/repos/github/techsavvyash/cQube-POCs/badge.svg?branch=master)](https://coveralls.io/github/techsavvyash/cQube-POCs?branch=master)
### Documentation

[Find Docs in docs folder](docs/)

### TOODs on Speeding of Datasets

- [x] Fix the script to generate data in sequence => older timestamps to newer timestamps. Impacts the [speed of insertion](https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/)
  - 10 mins for for 10M records
- [ ] Add pgpool to the server to server as a cache
- [ ] Add a Express Server to read queries using an API
- [ ] Add Varnish in front on it to verify the queries
- [ ] TimescaleDB to be configured with a [data retention policy](https://docs.timescale.com/timescaledb/latest/how-to-guides/data-retention/)
- [ ] Setup [continuous aggregates](https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/)
- [ ] Queries to be modified based on [this doc](https://docs.timescale.com/timescaledb/latest/how-to-guides/query-data/advanced-analytic-queries/)

### TOODs on Speeding up Ingestions

- [ ] Implement 7Zip as the compression algorithm @htvenkatesh
- [ ] POC on Insertion of 30M records from a CSV file (from 7Zip file) @htvenkatesh
- [ ] Log Management - Log Rotation; Log Compression; Log Forwarding; @htvenkatesh
- [ ] NVSK - Cloudflare
- [ ] Throttle based on IP - Nest applications
- [ ] Add a cache on the fronted (etags)

### TOODs on cQube Implementation

- [ ] Can be tracked [here](./impl/c-qube/src/app.service.ts).
- [ ] Adapter Implemenation with the following use case
  - [ ] [Dataset1](https://ntpproductionall.blob.core.windows.net/public-reports/public/diksha-data-exhaust/2023-01-11.csv)
  - [ ] [Dataset2]()
  - [ ] [Dataset3]()
  - [ ] [Dataset4]()
  - [ ] [Dataset5]()
- [ ] [Implement Dashlet Specification](https://project-sunbird.atlassian.net/wiki/spaces/SBDES/pages/2312110137/Dashlets+Design+Doc)
- [ ] [Auto Dashboard and Chart Creation using Metabase API and making it public](https://www.metabase.com/learn/administration/metabase-api)
- [ ] A UI to import data and define configs
- [ ] Aggregation of Events
- [ ] Tranformers for Bulk Events management - Use [Polars](https://github.com/pola-rs/polars) to do it in native JS/TS.
