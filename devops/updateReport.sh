#!/usr/bin/env bash

########################################
# 1) SETUP / CONFIG
########################################

# Where we store the last check time (epoch seconds)
LAST_CHECK_FILE="/home/tonont/utmcheck/caddy-logs-last-check-time.log"

# Where we store the final counts before DB insert
COUNT_FILE="/home/tonont/utmcheck/caddy-logs-utm-counts.txt"

# PostgreSQL connection string
PG_URI="postgres://ontonont:Not0nPrASD6P@127.0.0.1:8008/production-mini-app"

# The Docker service name for caddy
SERVICE_NAME="caddy_caddy"

########################################
# 2) DETERMINE HOW FAR BACK TO FETCH LOGS
########################################

CURRENT_TIME="$(date +%s)"

if [[ ! -f "${LAST_CHECK_FILE}" ]]; then
  # If file doesn't exist, check logs from the last 24 hours (or your choice)
  SINCE="24h"
else
  # Otherwise, read the last check time
  LAST_TIME="$(cat "${LAST_CHECK_FILE}")"
  DIFF=$(( CURRENT_TIME - LAST_TIME ))
  if [[ "${DIFF}" -lt 0 ]]; then
    # System clock changed or invalid data; fallback to 24h
    SINCE="24h"
  else
    # Use the difference in seconds
    SINCE="${DIFF}s"
  fi
fi

echo "Fetching caddy logs since: ${SINCE}"

########################################
# 3) FETCH LOGS & EXTRACT UTMs WITH COUNTS
########################################
# - We look for lines containing tgWebAppStartParam=
# - Exclude lines that *already* match a full UUID right after tgWebAppStartParam= 
#   (the test for standard 8-4-4-4-12 hex digits).
# - Extract the substring after tgWebAppStartParam= as the UTM.
# - Then *also* exclude UTMs that contain a dash (since you never want UTMs with dashes).
# - Finally, count and sort them.

docker service logs \
  --since "${SINCE}" \
  --follow=false \
  "${SERVICE_NAME}" 2>&1 \
| jq -Rr '
    # A) Keep only lines with tgWebAppStartParam= ...
    select(
      test("tgWebAppStartParam=")
      # B) ... but NOT lines that contain a UUID after tgWebAppStartParam=
      and (
        test("tgWebAppStartParam=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
        | not
      )
    )
    # C) Extract the actual UTM substring
    | match("tgWebAppStartParam=(?<utm>[^\" &]+)")?
    # D) Skip if the extracted UTM is null or if it has any dash
    | select(.captures[0].string | test("-") | not)
    # E) Finally, output only the string
    | .captures[0].string
' \
| sort \
| uniq -c \
| sort -nr \
| awk '{print $2 " = " $1}' \
> "${COUNT_FILE}"

echo "---------------------------------"
echo "UTM counts collected (utm = count):"
cat "${COUNT_FILE}"
echo "---------------------------------"

########################################
# 4) UPSERT RESULTS INTO POSTGRES
########################################
if [[ -s "${COUNT_FILE}" ]]; then
  {
    echo "BEGIN;"
    while IFS= read -r line; do
      UTM="$(echo "${line}" | awk -F ' = ' '{print $1}')"
      CNT="$(echo "${line}" | awk -F ' = ' '{print $2}')"

      cat <<SQL
DO \$\$
DECLARE
   rec RECORD;
BEGIN
   SELECT 1
     FROM utm_report
    WHERE utm = '${UTM}'
    INTO rec;

   IF NOT FOUND THEN
     INSERT INTO utm_report
       (utm, clicks, orders, "updateAt", "createAt")
     VALUES
       ('${UTM}', ${CNT}, 0, NOW(), NOW());
   ELSE
     UPDATE utm_report
        SET clicks = clicks + ${CNT},
            "updateAt" = NOW()
      WHERE utm = '${UTM}';
   END IF;
END;
\$\$;
SQL

    done < "${COUNT_FILE}"
    echo "COMMIT;"
  } | psql "${PG_URI}"
else
  echo "No new UTMs found."
fi

########################################
# 5) UPDATE LAST CHECK TIME
########################################

echo "${CURRENT_TIME}" > "${LAST_CHECK_FILE}"

exit 0
