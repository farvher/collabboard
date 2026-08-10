#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# CollabBoard — Deploy to GCP Cloud Run
# Builds Docker images, pushes to Artifact Registry, deploys services.
# Usage: ./infra/deploy.sh
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────
PROJECT_ID="collabboard-505115"
REGION="us-central1"
AR_REPO="collabboard"
AR_HOST="${REGION}-docker.pkg.dev"
IMAGE_BASE="${AR_HOST}/${PROJECT_ID}/${AR_REPO}"

BACKEND_IMAGE="${IMAGE_BASE}/backend"
FRONTEND_IMAGE="${IMAGE_BASE}/frontend"

SERVICE_ACCOUNT="collabboard-sa@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUD_SQL_CONNECTION="${PROJECT_ID}:${REGION}:collabboard-db"
GCS_BUCKET="${PROJECT_ID}-storage"

TAG="${1:-latest}"

echo "═══════════════════════════════════════════════"
echo " CollabBoard Deploy to Cloud Run"
echo " Tag: ${TAG}"
echo "═══════════════════════════════════════════════"

# ─── Authenticate Docker ──────────────────────────────────────────
echo ""
echo ">>> Authenticating Docker with Artifact Registry..."
gcloud auth configure-docker ${AR_HOST} --quiet

# ─── Build & Push Backend ─────────────────────────────────────────
echo ""
echo ">>> Building backend image..."
docker build -t ${BACKEND_IMAGE}:${TAG} -t ${BACKEND_IMAGE}:latest ./backend

echo ">>> Pushing backend image..."
docker push ${BACKEND_IMAGE}:${TAG}
docker push ${BACKEND_IMAGE}:latest

# ─── Deploy Backend to Cloud Run ──────────────────────────────────
echo ""
echo ">>> Deploying backend to Cloud Run..."
gcloud run deploy collabboard-backend \
  --image=${BACKEND_IMAGE}:${TAG} \
  --region=${REGION} \
  --platform=managed \
  --service-account=${SERVICE_ACCOUNT} \
  --set-env-vars="SPRING_PROFILES_ACTIVE=gcp" \
  --set-env-vars="CLOUD_SQL_CONNECTION_NAME=${CLOUD_SQL_CONNECTION}" \
  --set-env-vars="DB_NAME=collabboard" \
  --set-env-vars="DB_USER=collabboard" \
  --set-env-vars="GCS_BUCKET_NAME=${GCS_BUCKET}" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --set-secrets="JWT_SECRET=jwt-secret:latest" \
  --add-cloudsql-instances=${CLOUD_SQL_CONNECTION} \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60s \
  --allow-unauthenticated \
  --quiet

# Get backend URL
BACKEND_URL=$(gcloud run services describe collabboard-backend \
  --region=${REGION} --format="value(status.url)")
echo "   Backend URL: ${BACKEND_URL}"

# Update CORS to allow the frontend URL
gcloud run services update collabboard-backend \
  --region=${REGION} \
  --update-env-vars="CORS_ALLOWED_ORIGINS=${BACKEND_URL},https://collabboard-frontend-*.run.app" \
  --quiet

# ─── Build & Push Frontend ────────────────────────────────────────
echo ""
echo ">>> Building frontend image (API URL: ${BACKEND_URL})..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} \
  -t ${FRONTEND_IMAGE}:${TAG} \
  -t ${FRONTEND_IMAGE}:latest \
  ./frontend

echo ">>> Pushing frontend image..."
docker push ${FRONTEND_IMAGE}:${TAG}
docker push ${FRONTEND_IMAGE}:latest

# ─── Deploy Frontend to Cloud Run ─────────────────────────────────
echo ""
echo ">>> Deploying frontend to Cloud Run..."
gcloud run deploy collabboard-frontend \
  --image=${FRONTEND_IMAGE}:${TAG} \
  --region=${REGION} \
  --platform=managed \
  --port=3000 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --timeout=30s \
  --allow-unauthenticated \
  --quiet

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe collabboard-frontend \
  --region=${REGION} --format="value(status.url)")

# ─── Update Backend CORS with actual frontend URL ─────────────────
echo ""
echo ">>> Updating backend CORS with frontend URL..."
gcloud run services update collabboard-backend \
  --region=${REGION} \
  --update-env-vars="CORS_ALLOWED_ORIGINS=${FRONTEND_URL}" \
  --quiet

# ─── Summary ──────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo " Frontend: ${FRONTEND_URL}"
echo " Backend:  ${BACKEND_URL}"
echo ""
echo " Health:   ${BACKEND_URL}/actuator/health"
echo ""
echo "═══════════════════════════════════════════════════════════"
