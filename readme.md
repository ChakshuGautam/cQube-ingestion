

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