# Delete previous deployments
kubectl delete -f ../kubernetes-configurations/

# Recreate API Docker Containers
docker build -t drehnstrom/events-api:v1.0 ../events-api
docker push drehnstrom/events-api:v1.0

# Recreate Website Docker Containers
docker build -t drehnstrom/events-web:v1.0 ../events-website
docker push drehnstrom/events-web:v1.0

# Apply Kubernetes configuration
kubectl apply -f ../kubernetes-configurations/
