#!/bin/bash

set -e

# Directory for the service token
TOKEN_DIR="/usr/share/elasticsearch/elastic-service-token"
TOKEN_FILE="${TOKEN_DIR}/service-token.txt"

# Create directory if it doesn't exist
mkdir -p "$TOKEN_DIR"
rm -f "$TOKEN_FILE"
# Check if the token already exists
#if [ ! -f "$TOKEN_FILE" ]; then
  echo "Generating service account token for Kibana..."

  # Generate the token and extract only the token value
  /usr/share/elasticsearch/bin/elasticsearch-service-tokens create elastic/kibana kibana | awk '{print $NF}' > "$TOKEN_FILE"
#fi

# Optional: Print the generated token for debugging
echo "Service token generated and saved to $TOKEN_FILE:"
cat "$TOKEN_FILE"

# Execute the default Elasticsearch entrypoint
exec /bin/tini -- /usr/local/bin/docker-entrypoint.sh