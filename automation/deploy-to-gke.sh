# You need to already have a project created. Make sure the project
# you want to deploy to is set as the default for the gcloud CLI. 
# You could also edit the script and add the --project parameter to 
# each gcloud command. 

# Enable the required Cloud Services
gcloud services enable compute.googleapis.com container.googleapis.com
# Create the Cluster. Make sure you have a default Project Set.
gcloud container clusters create events-cluster --zone us-central1-c

# Connect to your Cluster. This set the kubectl context
gcloud container clusters get-credentials events-cluster --zone us-central1-c

# Need the database installed first using Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install database-server bitnami/mariadb

# Give the database a chance to start
echo "Will sleep for a minute to let the database start. "
sleep 1m

# Once the database is installed, then apply all the Kubernetes configuration
kubectl apply -f ../kubernetes-configurations/
