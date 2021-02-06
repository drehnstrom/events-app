# Need the database installed first using Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install database-server bitnami/mariadb

# Once the database is installed, then apply all the Kubernetes configuration
kubectl apply -f ../kubernetes-configurations/