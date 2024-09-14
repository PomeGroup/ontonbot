import os
import subprocess

from database_configuration import DB_URL, MIGRATIONS_PATH, RESTORE_FILE


# Function to execute a migration
def run_migration(migration_file):
    """Executes a single migration file using the DATABASE_URL"""
    command = f"psql -f {os.path.join(MIGRATIONS_PATH, migration_file)} {DB_URL}"
    result = subprocess.run(command, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Migration {migration_file} failed:")
        print(result.stderr)
        exit(1)
    else:
        print(f"Migration {migration_file} applied successfully.")


# Main execution
if __name__ == "__main__":
    # command = "pnpm drizzle-kit generate:pg"
    # result = subprocess.run(command, shell=True, capture_output=True, text=True)

    for filename in sorted(os.listdir(MIGRATIONS_PATH)):
        if filename.endswith(".sql"):
            run_migration(filename)

    # command = f"psql -f {RESTORE_FILE} {DB_URL} "
    # subprocess.run(command, shell=True, capture_output=True, text=True)

    print("All migrations completed.")