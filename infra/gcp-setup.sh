#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# CollabBoard — GCP Infrastructure Setup
# Run this script ONCE to provision all GCP resources.
# Prerequisites: gcloud CLI authenticated, project set
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────
PROJECT_ID="collabboard-505115"
REGION="us-central1"
DB_INSTANCE_NAME="collabboard-db"
DB_NAME="collabboard"
DB_USER="collabboard"
DB_PASSWORD=$(openssl rand -base64 24)
GCS_BUCKET="${PROJECT_ID}-storage"
SERVICE_ACCOUNT_NAME="collabboard-sa"
AR_REPO="collabboard"

echo "═══════════════════════════════════════════════"
echo " CollabBoard GCP Setup"
echo " Project: ${PROJECT_ID}"
echo " Region:  ${REGION}"
echo "═══════════════════════════════════════════════"

# ─── Set project ──────────────────────────────────────────────────
gcloud config set project ${PROJECT_ID}

# ─── Enable required APIs ─────────────────────────────────────────
echo ""
echo ">>> Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com

# ─── Create Artifact Registry repository ──────────────────────────
echo ""
echo ">>> Creating Artifact Registry repository..."
gcloud artifacts repositories create ${AR_REPO} \
  --repository-format=docker \
  --location=${REGION} \
  --description="CollabBoard Docker images" \
  --quiet 2>/dev/null || echo "   (repository already exists)"

# ─── Create Cloud SQL PostgreSQL instance ─────────────────────────
echo ""
echo ">>> Creating Cloud SQL instance (this takes 5-10 minutes)..."
gcloud sql instances create ${DB_INSTANCE_NAME} \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=${REGION} \
  --storage-type=SSD \
  --storage-size=10GB \
  --no-assign-ip \
  --network=default \
  --quiet 2>/dev/null || echo "   (instance already exists)"

# Create database
echo ">>> Creating database..."
gcloud sql databases create ${DB_NAME} \
  --instance=${DB_INSTANCE_NAME} \
  --quiet 2>/dev/null || echo "   (database already exists)"

# Create user
echo ">>> Creating database user..."
gcloud sql users create ${DB_USER} \
  --instance=${DB_INSTANCE_NAME} \
  --password="${DB_PASSWORD}" \
  --quiet 2>/dev/null || echo "   (user already exists)"

# ─── Create GCS bucket ────────────────────────────────────────────
echo ""
echo ">>> Creating GCS bucket..."
gcloud storage buckets create gs://${GCS_BUCKET} \
  --location=${REGION} \
  --uniform-bucket-level-access \
  --quiet 2>/dev/null || echo "   (bucket already exists)"

# Set CORS for the bucket (allow frontend to upload)
cat > /tmp/cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
EOF
gcloud storage buckets update gs://${GCS_BUCKET} --cors-file=/tmp/cors.json
rm /tmp/cors.json

# ─── Create Service Account ──────────────────────────────────────
echo ""
echo ">>> Creating service account..."
gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
  --display-name="CollabBoard Cloud Run SA" \
  --quiet 2>/dev/null || echo "   (service account already exists)"

SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant permissions
echo ">>> Granting permissions to service account..."
# Cloud SQL Client
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client" \
  --quiet

# GCS Object Admin (read/write/delete/sign URLs)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin" \
  --quiet

# Service Account Token Creator (for signed URLs)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --quiet

# ─── Store secrets in Secret Manager ─────────────────────────────
echo ""
echo ">>> Storing secrets..."

# DB Password
echo -n "${DB_PASSWORD}" | gcloud secrets create db-password \
  --data-file=- --quiet 2>/dev/null || \
  echo -n "${DB_PASSWORD}" | gcloud secrets versions add db-password --data-file=-

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)
echo -n "${JWT_SECRET}" | gcloud secrets create jwt-secret \
  --data-file=- --quiet 2>/dev/null || \
  echo "   (jwt-secret already exists)"

# Grant secret access to service account
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" --quiet

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" --quiet

# ─── Get Cloud SQL connection name ────────────────────────────────
CONNECTION_NAME=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(connectionName)")

# ─── Summary ──────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " SETUP COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo " Cloud SQL Instance:  ${DB_INSTANCE_NAME}"
echo " Connection Name:     ${CONNECTION_NAME}"
echo " Database:            ${DB_NAME}"
echo " DB User:             ${DB_USER}"
echo " DB Password:         (stored in Secret Manager: db-password)"
echo ""
echo " GCS Bucket:          gs://${GCS_BUCKET}"
echo ""
echo " Service Account:     ${SA_EMAIL}"
echo ""
echo " Artifact Registry:   ${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"
echo ""
echo " JWT Secret:          (stored in Secret Manager: jwt-secret)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo " NEXT STEPS:"
echo " 1. Run: ./infra/deploy.sh"
echo " 2. Or push a tag to trigger GitHub Actions deployment"
echo ""
echo " To authenticate Docker with Artifact Registry:"
echo "   gcloud auth configure-docker ${REGION}-docker.pkg.dev"
echo ""
