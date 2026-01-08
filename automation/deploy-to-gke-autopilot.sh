#!/bin/bash

# Deploy to GKE Autopilot
# You need to already have a project created. Make sure the project
# you want to deploy to is set as the default for the gcloud CLI. 
# You could also edit the script and add the --project parameter to 
# each gcloud command. 

# Generate unique cluster name with random suffix
RANDOM_SUFFIX=$(echo $RANDOM | md5sum | head -c 6)
CLUSTER_NAME="events-autopilot-${RANDOM_SUFFIX}"

echo "Creating cluster: ${CLUSTER_NAME}"

# Enable the required Cloud Services
echo "Enabling Compute Engine and Kubernetes APIs."
echo "This will take a couple minutes..."
gcloud services enable compute.googleapis.com container.googleapis.com

# Create the GKE Autopilot Cluster
echo "Creating GKE Autopilot cluster..."
echo "Note: Autopilot clusters take longer to provision (5-10 minutes)"
gcloud container clusters create-auto ${CLUSTER_NAME} --region us-central1

# Connect to your Cluster. This sets the kubectl context
gcloud container clusters get-credentials ${CLUSTER_NAME} --region us-central1

# Create the Kubernetes namespace
echo "Creating Kubernetes namespace..."
kubectl create namespace events-app
kubectl config set-context --current --namespace=events-app

# Need the database installed first using Helm
echo "Deploying Database..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install database-server bitnami/mariadb \
  --set auth.rootPassword=letmein! \
  --set primary.persistence.enabled=false \
  --set primary.resources.requests.memory=512Mi \
  --set primary.resources.requests.cpu=250m \
  --set primary.resources.limits.memory=1Gi \
  --set primary.resources.limits.cpu=500m \
  --set primary.containerSecurityContext.enabled=true \
  --set primary.containerSecurityContext.runAsUser=1001 \
  --set primary.containerSecurityContext.runAsNonRoot=true \
  --set primary.podSecurityContext.enabled=true \
  --set primary.podSecurityContext.fsGroup=1001 \
  -n events-app

# Wait for the database to be ready
echo "Waiting for MariaDB to be ready..."
echo "This may take several minutes on Autopilot while nodes are provisioned..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=mariadb -n events-app --timeout=600s

echo "MariaDB is ready!"

# Once the database is installed, then apply all the Kubernetes configuration
echo "Deploying application..."
kubectl apply -f ../kubernetes-configurations/ -n events-app

# Give the app a chance to deploy
# Note: Autopilot may take longer to schedule pods
echo "Will sleep for a couple minutes to let the application start..."
sleep 3m

kubectl get services -n events-app

echo ""
echo "If the public IPs are still pending, wait a minute and run the command kubectl get services -n events-app again."
echo ""
echo "Note: GKE Autopilot automatically manages nodes and resources for optimal efficiency."
