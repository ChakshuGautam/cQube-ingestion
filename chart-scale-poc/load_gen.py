import time
from psycopg2.pool import ThreadedConnectionPool
import threading
import random

start_time = time.time()
total_threads =180
# Connect to the database using a connection pool
pool = ThreadedConnectionPool(1, total_threads, host="localhost", database="postgres", user="timescaledb", password="postgrespassword")

# Function to execute a query in a separate thread
def execute_query(query):
  with pool.getconn() as conn:
    x = conn.cursor().execute(query)

# Create a list of 1000 queries
queries = ["""select sum(sum)/sum(count) as percentage, school_id, grade FROM random_data WHERE 
    date > now() - INTERVAL '15 days' 
    and date < now() - INTERVAL '10 days' 
	and school_id={}
	group by school_id, grade;""".format(random.randint(1, 1000)) for i in range(total_threads)]

# Create a list of threads
threads = [threading.Thread(target=execute_query, args=(query,)) for query in queries]

# Start all the threads
for thread in threads:
  thread.start()

# Wait for all the threads to finish
for thread in threads:
  thread.join()

end_time = time.time()
print ("Total Queries per second :: " + str(total_threads/(end_time - start_time)))

# Close the connection pool
# conn.close()

# The current benchmarch gives 18 queries per second on a 1 core machine with 1GB RAM
# More works needs to be done to speed this up to 1000 queries per second without a cache




