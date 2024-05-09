#!/bin/bash

# Check if two arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <path_to_migration_file> <docker_container_id>"
    exit 1
fi

# Assign the arguments to variables
MIGRATION_FILE=$1
CONTAINER_ID=$2

# Copy the migration file to the Docker container
sudo docker cp "$MIGRATION_FILE" "$CONTAINER_ID:/migration.sql"

# Execute the migration script inside the Docker container
sudo docker exec -it "$CONTAINER_ID" /bin/bash -c "psql -U onton -d ontondb -f /migration.sql"

echo "Migration completed."



