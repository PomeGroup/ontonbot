#!/bin/bash

# Function to print error messages in red
print_red() {
    echo -e "\033[31m$1\033[0m"
}

# Function to check if `gh` is installed, and install if not
check_gh_installation() {
    if ! command -v gh &> /dev/null; then
        echo "GitHub CLI (gh) is not installed. Attempting to install..."

        # Check the OS type and install accordingly
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt update
            sudo apt install -y gh
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install gh
            else
                echo "Homebrew is not installed. Please install Homebrew and try again."
                exit 1
            fi
        else
            echo "Unsupported OS. Please install GitHub CLI manually."
            exit 1
        fi

        if ! command -v gh &> /dev/null; then
            echo "Error: GitHub CLI (gh) installation failed. Please install it manually."
            exit 1
        fi

        echo "GitHub CLI (gh) installed successfully."
    else
        echo "GitHub CLI (gh) is already installed."
    fi
}

# Function to check if the user is authenticated with `gh`
check_gh_authentication() {
    if ! gh auth status &> /dev/null; then
        echo "GitHub CLI is not authenticated. Please run 'gh auth login' to authenticate."
        exit 1
    fi
    echo "GitHub CLI is authenticated."
}

# Function to ping domains and check their response
check_domains() {
    local a_record=""
    local cname_records=()

    for key in "${!env_vars[@]}"; do
        if [[ "$key" == "ONTON_DOMAIN" ]]; then
            a_record="${env_vars[$key]}"
            echo "Pinging A record domain: $a_record"
            if ! ping -c 1 "$a_record" &> /dev/null; then
                echo "A record domain $a_record is not reachable."
            else
                echo "A record domain $a_record is reachable."
            fi
        elif [[ "$key" == *_DOMAIN && "$key" != "LOCAL_DOMAIN" ]]; then
            domain="${env_vars[$key]}"
            echo "Pinging CNAME record domain: $domain"
            if ! ping -c 1 "$domain" &> /dev/null; then
                echo "CNAME record domain $domain is not reachable."
                cname_records+=("$domain")
            else
                echo "CNAME record domain $domain is reachable."
            fi
        fi
    done

    if [[ -n "$a_record" || ${#cname_records[@]} -gt 0 ]]; then
        read -p "Some domains may not exist on Cloudflare. Do you want to add them? (yes/no): " add_to_cloudflare
        if [[ "$add_to_cloudflare" == "yes" ]]; then
            add_domains_to_cloudflare "$a_record" "${cname_records[@]}"
        else
            echo "Operation canceled. Please check and add the domains manually if needed."
        fi
    else
        echo "All _DOMAIN variables are reachable."
    fi
}

# Function to add A and CNAME records to Cloudflare using environment variables from the .env file
add_domains_to_cloudflare() {
    local a_record=$1
    shift
    local cname_records=("$@")

    local email="${secrets["CLOUDFLARE_EMAIL"]}"
    local api_token="${secrets["CLOUDFLARE_API_TOKEN"]}"
    local dns_zone_id="${secrets["CLOUDFLARE_DNS_ZONE_ID"]}"
    local public_ip="${env_vars["NETWORK_PUBLIC_IP"]}"
    local target_domain="${env_vars["MINI_APP_DOMAIN"]}"

    echo "Email: $email"
    echo "API Token: $api_token"
    echo "DNS Zone ID: $dns_zone_id"
    echo "Public IP: $public_ip"
    echo "Target Domain: $target_domain"

    if [[ -z "$email" || -z "$api_token" || -z "$dns_zone_id" || -z "$public_ip" || -z "$target_domain" ]]; then
        print_red "Error: Required environment variables (Cloudflare email, API token, DNS zone ID, public IP, or target domain) are missing."
        exit 1
    fi

    # Add A record
    if [[ -n "$a_record" ]]; then
        echo "Attempting to add A record for $a_record to Cloudflare..."

        response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$dns_zone_id/dns_records" \
            -H "Authorization: Bearer $api_token" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "A",
                "name": "'"$a_record"'",
                "content": "'"$public_ip"'",
                "proxied": true
            }')

        if [[ "$(echo "$response" | jq -r '.success')" == "true" ]]; then
            echo "A record $a_record added successfully to Cloudflare."
        else
            echo "Failed to add A record $a_record to Cloudflare."
            echo "Error response: $(echo "$response" | jq -r '.errors')"
            exit 1
        fi
    fi

    # Add CNAME records
    for domain in "${cname_records[@]}"; do
        echo "Attempting to add CNAME record for $domain to Cloudflare..."
        response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$dns_zone_id/dns_records" \
            -H "Authorization: Bearer $api_token" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "CNAME",
                "name": "'"$domain"'",
                "content": "'"$a_record"'",
                "proxied": true
            }')

        if [[ "$(echo "$response" | jq -r '.success')" == "true" ]]; then
            echo "CNAME record $domain added successfully to Cloudflare."
        else
            echo "Failed to add CNAME record $domain to Cloudflare."
            echo "Error response: $(echo "$response" | jq -r '.errors')"
            exit 1
        fi
    done
}

# Global arrays to hold environment variables and secrets
declare -A env_vars
declare -A secrets

# Function to read the .env file with the specified prefix and separate variables and secrets
load_env_file() {
    env_file="./env_stages/.env.$env_prefix"

    if [[ ! -f $env_file ]]; then
        echo "Error: $env_file file not found!"
        exit 1
    fi

    # Read each line and classify as variable or secret
    while IFS='=' read -r key value; do
        if [[ -n "$key" && "$key" != \#* ]]; then
            if [[ -z "$value" ]]; then
                print_red "Error: $key has no value. Please assign a value or set it explicitly to \"\" if it should be empty."
                exit 1
            fi
            if [[ "$key" == SECRET_* ]]; then
                stripped_key="${key#SECRET_}"  # Remove "SECRET_" prefix for the secret name
                secrets["$stripped_key"]="$value"
            else
                env_vars["$key"]="$value"
            fi
        fi
    done < "$env_file"

    echo "Loaded environment variables and secrets from $env_file."

    # Debug: Print loaded environment variables and secrets
    echo "Environment variables loaded:"
    for key in "${!env_vars[@]}"; do
        echo "  $key=${env_vars[$key]}"
    done

    echo "Secrets loaded:"
    for key in "${!secrets[@]}"; do
        echo "  $key=[REDACTED]"
    done
}

# List of repositories
repos=(
    "PomeGroup/ontonbot"
)

# Check and install `gh` if needed
check_gh_installation

# Check if `gh` CLI is authenticated
check_gh_authentication

# Prompt the user to select the environment prefix
options=("dev" "staging" "sandbox" "hotfix" "main")
PS3="Select the environment prefix: "

select env_prefix in "${options[@]}"; do
    if [[ -n "$env_prefix" ]]; then
        echo "You selected '$env_prefix'."
        if [[ "$env_prefix" == "main" ]]; then
            read -p "Are you sure you want to proceed with 'main'? (yes/no): " confirmation
            if [[ "$confirmation" != "yes" ]]; then
                print_red "Operation canceled. Please select another environment or confirm 'main'."
                exit 1
            fi
        fi
        break
    else
        print_red "Invalid selection. Please choose a valid option."
    fi
done

# Load the appropriate .env file
load_env_file

#check domains
check_domains


# Iterate over repositories and delete old secrets and variables
# Convert the prefix to uppercase
#env_prefix_upper=$(echo "$env_prefix" | tr '[:lower:]' '[:upper:]')
#for repo in "${repos[@]}"; do
#    echo "Deleting old secrets with prefix '$env_prefix' in $repo"
#    echo "gh secret list --repo \"$repo\" --app actions | awk '{print $1}'"
#    # Delete old secrets in parallel
#    existing_secrets=$(gh secret list --repo "$repo" --app actions | awk '{print $1}')
#    for secret in $existing_secrets; do
#        echo "try to delete secret $secret ${env_prefix_upper}"
#        if [[ "$secret" == ${env_prefix_upper}_* ]]; then
#            echo "Deleting secret $secret from $repo"
#
#            printf 'y\n' | gh secret delete "$secret" --repo "$repo" --app actions &
#        fi
#    done
#
#    echo "Deleting old variables with prefix '$env_prefix_upper' in $repo"
#
#    # Delete old variables in parallel
#    existing_vars=$(gh variable list --repo "$repo" | awk '{print $1}')
#    for var in $existing_vars; do
#        if [[ "$var" == ${env_prefix_upper}_* ]]; then
#            echo "Deleting variable $var from $repo"
#            gh variable delete "$var" --repo "$repo" &
#        fi
#    done
#done

 #Wait for all background deletion jobs to finish
wait

# Iterate over repositories and set new secrets and variables in parallel
for repo in "${repos[@]}"; do
    # Set secrets
    if [[ ${#secrets[@]} -gt 0 ]]; then
        for key in "${!secrets[@]}"; do
            secret_name="${env_prefix}_${key}"  # The secret name without "SECRET_"
            secret_value="${secrets[$key]}"
            secret_value="${secret_value//\"/}"  # Remove double quotes

            echo "Setting secret $secret_name for $repo"
            gh secret set "$secret_name" --repo "$repo" --app actions --body "$secret_value" &
        done
    else
        echo "No secrets to set for $repo."
    fi

    # Set variables
    if [[ ${#env_vars[@]} -gt 0 ]]; then
        for key in "${!env_vars[@]}"; do
            var_name="${env_prefix}_${key}"
            var_value="${env_vars[$key]}"
            var_value="${var_value//\"/}"  # Remove double quotes

            echo "Setting variable $var_name for $repo"
            gh variable set "$var_name" --repo "$repo" --body "$var_value" &
        done
    else
        echo "No environment variables to set for $repo."
    fi
done


# Wait for all background setting jobs to finish
wait

echo "Environment variables and secrets have been updated for all specified repositories."
