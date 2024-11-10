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

# Global arrays to hold environment variables and secrets
declare -A env_vars
declare -A secrets

# Function to read the .env file with the specified prefix and separate variables and secrets
load_env_file() {
    env_file=".env.$env_prefix"

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
#    "PomeGroup/onton"
#    "PomeGroup/temporary-landing"
)

# Check and install `gh` if needed
check_gh_installation

# Check if `gh` CLI is authenticated
check_gh_authentication

# Ask the user for the environment prefix
read -p "Enter the environment prefix (e.g., dev, prod): " env_prefix

if [[ -z "$env_prefix" ]]; then
    echo "Environment prefix is required!"
    exit 1
fi

# Load the appropriate .env file
load_env_file

# Iterate over repositories and delete old secrets and variables
for repo in "${repos[@]}"; do
    echo "Deleting old secrets with prefix '$env_prefix' in $repo"

    # Delete old secrets in parallel
    existing_secrets=$(gh secret list --repo "$repo" --app actions | awk '{print $1}')
    for secret in $existing_secrets; do
        if [[ "$secret" == ${env_prefix}_* ]]; then
            echo "Deleting secret $secret from $repo"
            printf 'y\n' | gh secret delete "$secret" --repo "$repo" --app actions &
        fi
    done

    echo "Deleting old variables with prefix '$env_prefix' in $repo"

    # Delete old variables in parallel
    existing_vars=$(gh variable list --repo "$repo" | awk '{print $1}')
    for var in $existing_vars; do
        if [[ "$var" == ${env_prefix}_* ]]; then
            echo "Deleting variable $var from $repo"
            gh variable delete "$var" --repo "$repo" &
        fi
    done
done

# Wait for all background deletion jobs to finish
wait

# Iterate over repositories and set new secrets and variables in parallel
for repo in "${repos[@]}"; do
    # Set secrets
    if [[ ${#secrets[@]} -gt 0 ]]; then
        for key in "${!secrets[@]}"; do
            secret_name="${env_prefix}_${key}"  # The secret name without "SECRET_"
            secret_value="${secrets[$key]}"

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
