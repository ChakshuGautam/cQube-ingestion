DROP TABLE IF EXISTS random_data;
CREATE TABLE IF NOT EXISTS random_data (id INTEGER, created_at TIMESTAMP, updated_at TIMESTAMP, date DATE, school_id INTEGER, grade INTEGER, count INTEGER, sum INTEGER, percentage REAL);
SELECT create_hypertable('random_data', 'date', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ix_symbol_time ON random_data (school_id, grade, date DESC);

select sum(sum), sum(count), sum(sum)/sum(count) as percentage, school_id, grade FROM random_data WHERE 
    date > now() - INTERVAL '13 days' 
    and date < now() - INTERVAL '10 days' group by school_id, grade;


SELECT pg_stat_statements_reset();
select sum(sum), sum(count), sum(sum)/sum(count) as percentage, school_id, grade FROM random_data WHERE 
    date > now() - INTERVAL '34 days' 
    and date < now() - INTERVAL '33 days' group by school_id, grade;

select sum(sum), sum(count), sum(sum)/sum(count) as percentage, school_id, grade FROM random_data WHERE 
    date > now() - INTERVAL '15 days' 
    and date < now() - INTERVAL '10 days' 
	and school_id=1
	group by school_id, grade;


SELECT set_chunk_time_interval('random_data', INTERVAL '24 hours');

SELECT * FROM timescaledb_information.hypertables;
SELECT show_chunks('random_data');
