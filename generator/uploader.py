import psycopg2

# Connect to the database
# postgres://timescaledb:postgrespassword@timescaledb:5432/postgres?sslmode=disable
conn = psycopg2.connect(host="localhost", database="postgres", user="timescaledb", password="postgrespassword")
cur = conn.cursor()

# Create the table in the database
# cur.execute("CREATE TABLE IF NOT EXISTS random_data (id INTEGER, created_at TIMESTAMP, updated_at TIMESTAMP, date DATE, school_id INTEGER, grade INTEGER, count INTEGER, sum INTEGER, percentage REAL)")

copy_sql = """
           COPY random_data FROM stdin WITH CSV HEADER
           DELIMITER as ','
           """

# Open the CSV file for reading
# with open('random_data.csv', 'r') as csv_input:
#   # Load the data from the CSV file into the database
#   cur.copy_from(csv_input, 'random_data', sep=',')
#   conn.commit()
# update buffering to 2GB
with open('random_data.csv', 'r', buffering=10^9) as f:
    cur.execute("TRUNCATE TABLE random_data")
    cur.copy_expert(sql=copy_sql, file=f)
    conn.commit()
    cur.close()

# Close the cursor and connection
# cur.close()
# conn.close()