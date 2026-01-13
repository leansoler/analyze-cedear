#!/bin/bash

# This script creates/updates a Google Cloud Scheduler job and grants it the necessary
# permissions to trigger the scrapInvertirOnline Cloud Function on a daily basis.
# It's designed to be idempotent and to serve as documentation for the infrastructure.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
# This script uses environment variables for configuration:
#
#   GCP_PROJECT_ID: (Required) Your Google Cloud Project ID.
#   GCP_REGION:     (Optional) The region for resources. Defaults to "us-central1".
#
# Example:
#   export GCP_PROJECT_ID="your-project-id"
#   export GCP_REGION="us-east1"

# The name for the dedicated service account that the scheduler will use to invoke the function.
# This will be created if it doesn't exist.
SCHEDULER_SA_NAME="scheduler-invoker-sa"


# --- Static Configuration (usually no need to change) ---

# The region where your function and scheduler job are deployed.
# It defaults to "us-central1" if the GCP_REGION environment variable is not set.
GCP_REGION="${GCP_REGION:-us-central1}"

# The name of the Cloud Function to trigger.
FUNCTION_NAME="scrap-invertir-online"

# The desired name for the Cloud Scheduler job.
JOB_NAME="trigger-${FUNCTION_NAME}-daily"

# The schedule in cron format (e.g., '0 6 * * *' for 6:00 AM every day).
SCHEDULE="0 6 * * *"

# The timezone for the schedule.
TIMEZONE="Etc/UTC"

# --- Script Logic ---

echo "Verifying configuration..."

if [[ -z "${GCP_PROJECT_ID}" ]]; then
  echo "ERROR: The GCP_PROJECT_ID environment variable is not set."
  echo "Please set it before running the script, e.g., export GCP_PROJECT_ID=\"your-project-id\""
  exit 1
fi

# Construct the full URL for the Cloud Function and the service account email.
FUNCTION_URL="https://${GCP_REGION}-${GCP_PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
SERVICE_ACCOUNT_EMAIL="${SCHEDULER_SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo "Project: ${GCP_PROJECT_ID}"
echo "Region: ${GCP_REGION}"
echo "Function to trigger: ${FUNCTION_NAME} at ${FUNCTION_URL}"
echo "Scheduler Job: ${JOB_NAME}"
echo "Service Account: ${SERVICE_ACCOUNT_EMAIL}"
echo "Schedule: '${SCHEDULE}' in timezone '${TIMEZONE}'"
echo ""

# --- Service Account Creation ---
echo "Ensuring service account '${SCHEDULER_SA_NAME}' exists..."

# Check if the service account already exists.
# The command's output is redirected to /dev/null to suppress it, and we check the exit code.
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" --project="${GCP_PROJECT_ID}" &> /dev/null; then
  echo "Service account not found. Creating it..."
  gcloud iam service-accounts create "${SCHEDULER_SA_NAME}" \
    --project="${GCP_PROJECT_ID}" \
    --display-name="Service Account for Cloud Scheduler jobs"
else
  echo "Service account already exists."
fi
echo ""

# Deploy the Cloud Scheduler job.
# The command will create the job if it doesn't exist or update it if it does.

echo "Creating or updating Cloud Scheduler job..."
gcloud scheduler jobs update http "${JOB_NAME}" \
    --project="${GCP_PROJECT_ID}" \
    --location="${GCP_REGION}" \
    --schedule="${SCHEDULE}" \
    --time-zone="${TIMEZONE}" \
    --uri="${FUNCTION_URL}" \
    --http-method=POST \
    --oidc-service-account-email="${SERVICE_ACCOUNT_EMAIL}" \
    --description="Daily trigger for the ${FUNCTION_NAME} function." \
    || \
gcloud scheduler jobs create http "${JOB_NAME}" \
    --project="${GCP_PROJECT_ID}" \
    --location="${GCP_REGION}" \
    --schedule="${SCHEDULE}" \
    --time-zone="${TIMEZONE}" \
    --uri="${FUNCTION_URL}" \
    --http-method=POST \
    --oidc-service-account-email="${SERVICE_ACCOUNT_EMAIL}" \
    --description="Daily trigger for the ${FUNCTION_NAME} function."

echo "Scheduler job '${JOB_NAME}' configured successfully."
echo ""

# Grant the scheduler's service account permission to invoke the Cloud Function.
# This is an additive command and is safe to run multiple times.

echo "Granting invoker permissions to the service account..."
gcloud functions add-invoker-policy-binding "${FUNCTION_NAME}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --quiet

echo "Permissions granted successfully."
echo ""
echo "Deployment complete."
