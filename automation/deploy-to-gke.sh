# You need to already have a project created. Make sure the project
# you want to deploy to is set as the default for the gcloud CLI. 
# You could also edit the script and add the --project parameter to 
# each gcloud command. 

# Generate unique cluster name with random suffix
RANDOM_SUFFIX=$(echo $RANDOM | md5sum | head -c 6)
CLUSTER_NAME="events-cluster-${RANDOM_SUFFIX}"

# Enable the required Cloud Services
echo "Enabling Compute Engine and Kubernetes APIs."
echo "This will take a couple minutes..."
gcloud services enable compute.googleapis.com container.googleapis.com


# Create the Cluster. Make sure you have a default Project Set.
echo "Creating Kubernetes cluster..."
gcloud container clusters create ${CLUSTER_NAME} --zone us-central1-c --enable-network-policy

# Connect to your Cluster. This set the kubectl context
gcloud container clusters get-credentials events-cluster --zone us-central1-c

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
  -n events-app

# Give the database a chance to start
echo "Will sleep for a minute to let the database start..."
sleep 1m

# Once the database is installed, then apply all the Kubernetes configuration
echo "Deploying application..."
kubectl apply -f ../kubernetes-configurations/ -n events-app

# Give the app a chance to start to deploy
echo "Will sleep for a couple minutes to let the application start..."
sleep 3m

kubectl get services -n events-app

echo "If the public IPs are still pending, wait a minute and run the command kubectl get services -n events-app again. "
