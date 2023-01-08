import csv
import random
import datetime

# Number of rows to generate
num_rows = 10000000 # 10 million
dates = [datetime.date(2022, 12, i) for i in range(1, 32)]

# Open a new CSV file for writing
with open('random_data.csv', 'w') as csvfile:
  fieldnames = ['id', 'created_at', 'updated_at', 'date', 'school_id', 'grade', 'count', 'sum', 'percentage']
  writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
  writer.writeheader()

  # Generate the specified number of rows
  for date in dates:
    for i in range(int(num_rows/31)):
      # Generate random data for each field
      data = {
        'id': i+1,
        'created_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'updated_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'date': date.strftime('%Y-%m-%d'),
        'school_id': random.randint(1, 1000),
        'grade': random.randint(0, 12),
        'count': random.randint(1, 30),
        'sum': random.randint(1, 1000),
        'percentage': random.uniform(0.0, 100.0)
      }

      # Write the data to the CSV file
      writer.writerow(data)

      # Flush the CSV file to ensure it is written to disk
      csvfile.flush()

csvfile.close()