#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# CollabBoard — GCP Teardown (Stop all billing)
# Deletes all GCP resources to stop charges.
# Run: bash infra/gcp-teardown.sh
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ID="collabboard-505115"
REGION="us-central1"

echo "═══════════════════════════════════════════════"
echo " CollabBoard GCP TEARDOWN"
echo " This will DELETE all resources!"
echo "═══════════════════════════════════════════════"
echo ""
read -p "Are you sure? Type 'yes' to confirm: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

gcloud config set project ${PROJECT_ID}

# ─── Delete Cloud Run services ────────────────────────────────────
echo ""
echo ">>> Deleting Cloud Run services..."
gcloud run services delete collabboard-backend --region=${REGION} --quiet 2>/dev/null || echo "   backend already deleted"
gcloud run services delete collabboard-frontend --region=${REGION} --quiet 2>/dev/null || echo "   frontend already deleted"

# ─── Delete Artifact Registry images ─────────────────────────────
echo ""
echo ">>> Deleting Artifact Registry repository..."
gcloud artifacts repositories delete collabboard --location=${REGION} --quiet 2>/dev/null || echo "   repo already deleted"

# ─── Delete GCS bucket ────────────────────────────────────────────
echo ""
echo ">>> Deleting GCS bucket..."
gcloud storage rm -r gs://${PROJECT_ID}-storage --quiet 2>/dev/null || echo "   bucket already deleted"

# ─── Delete Secrets ───────────────────────────────────────────────
echo ""
echo ">>> Deleting secrets..."
gcloud secrets delete db-password --quiet 2>/dev/null || echo "   db-password already deleted"
gcloud secrets delete jwt-secret --quiet 2>/dev/null || echo "   jwt-secret already deleted"
gcloud secrets delete database-url --quiet 2>/dev/null || echo "   database-url already deleted"

# ─── Delete Service Account ──────────────────────────────────────
echo ""
echo ">>> Deleting service account..."
gcloud iam service-accounts delete collabboard-sa@${PROJECT_ID}.iam.gserviceaccount.com --quiet 2>/dev/null || echo "   SA already deleted"

# ─── Delete Workload Identity Pool ────────────────────────────────
echo ""
echo ">>> Deleting Workload Identity Pool..."
gcloud iam workload-identity-pools delete github-pool --location=global --quiet 2>/dev/null || echo "   pool already deleted"

# ─── Delete Cloud SQL (if still exists) ──────────────────────────
echo ""
echo ">>> Checking for Cloud SQL instances..."
gcloud sql instances delete collabboard-db --quiet 2>/dev/null || echo "   no Cloud SQL instance"

echo ""
echo "═══════════════════════════════════════════════"
echo " TEARDOWN COMPLETE"
echo " All billable resources have been deleted."
echo ""
echo " Note: Neon (external) is not affected."
echo " To delete Neon DB: https://console.neon.tech"
echo "═══════════════════════════════════════════════"
