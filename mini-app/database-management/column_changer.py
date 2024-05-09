import psycopg2
from urllib.parse import urlparse
from database_configuration import DB_URL, MIGRATIONS_PATH

# Parse the database URL
result = urlparse(DB_URL)
username = result.username
password = result.password
database = result.path[1:]
hostname = result.hostname
port = result.port

# Connect to the database
connection = psycopg2.connect(
    database=database, user=username, password=password, host=hostname, port=port
)


# Function to update a column to a given value
def update_column(table_name, column_name, new_value):
    try:
        with connection.cursor() as cursor:
            # SQL query to update the column
            query = f"UPDATE {table_name} SET {column_name} = %s WHERE username='samyar_kd'"
            cursor.execute(query, (new_value,))
            connection.commit()
            print(f"Column {column_name} in table {table_name} updated successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if connection:
            connection.close()


update_column("users", "role", "organizer")
