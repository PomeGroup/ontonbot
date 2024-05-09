import sqlite3
from sqlite3 import Error

def create_connection(db_file):
    """Create a database connection to the SQLite database specified by db_file."""
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)

    return conn

def create_table(conn, create_table_sql):
    """Create a table from the create_table_sql statement."""
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)

def main():
    database = "telegram_users.db"

    sql_create_referrals_table = """
    CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY,
        referee INTEGER NOT NULL,
        referral INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """

    # Create a database connection
    conn = create_connection(database)

    # Create table
    if conn is not None:
        create_table(conn, sql_create_referrals_table)
    else:
        print("Error! Cannot create the database connection.")

    # Close the connection
    if conn:
        conn.close()

if __name__ == '__main__':
    main()
