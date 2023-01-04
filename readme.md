### Creating and uploading data to the server

```shell
python generator/school_attendace.py
python generator/uploader.py
```

This can take upto 10 minutes to complete.

### TOODs
- [ ] Fix the script to generate data in sequence => older timestamps to newer timestamps. Impacts the [speed of insertion](https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/)
- [ ] Add pgpool to the server to server as a cache
- [ ] Add a Express Server to read queries using an API
- [ ] Add Varnish in front on it to verify the queries
- [ ] TimescaleDB to be configured with a [data retention policy](https://docs.timescale.com/timescaledb/latest/how-to-guides/data-retention/)
- [ ] Setup [continuous aggregates](https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/)
- [ ] Queries to be modified based on [this doc](https://docs.timescale.com/timescaledb/latest/how-to-guides/query-data/advanced-analytic-queries/)