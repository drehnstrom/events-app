# Simple Kubernetes Events App

A simple events management application built to demonstrate Kubernetes and Google Kubernetes Engine (GKE) concepts. This demo app showcases microservices architecture, container orchestration, service discovery, and database integration in a Kubernetes environment.

## About This Demo

This application is designed for learning and teaching Kubernetes fundamentals, including:
- **Microservices architecture** - Three independent services working together
- **Container deployment** - Docker images running on Kubernetes
- **Service discovery** - Internal DNS and service communication
- **Database integration** - MariaDB deployed via Helm charts
- **Health checks** - Liveness and readiness probes
- **Multi-platform builds** - Supporting both ARM64 and AMD64 architectures
- **Cloud deployment** - Running on Google Kubernetes Engine

The app allows users to view, create, and "like" events through a simple web interface, with all data stored in a MariaDB database.

---

## Kubernetes demo application with three microservices: API, Website, and Database Initializer.

---

## Running in Minikube

### 1. Start Minikube
```bash
minikube start --memory=4096 --cpus=2
```

### 2. Point Docker to Minikube's Registry
```bash
eval $(minikube docker-env)
```

### 3. Build the Images Locally
```bash
cd events-api
docker build -t events-api:v2.0 .

cd ../events-website
docker build -t events-web:v2.0 .

cd ../database-initializer
docker build -t events-job:v2.0 .

cd ..
```

### 4. Create the Kubernetes Namespace
```bash
kubectl create namespace events-app
kubectl config set-context --current --namespace=events-app
```

### 5. Install Helm (if needed)
```bash
brew install helm
```

### 6. Deploy MariaDB with Helm
```bash
# Add Bitnami Helm repo
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install MariaDB
helm install database-server bitnami/mariadb \
  --set auth.rootPassword=letmein! \
  --set primary.persistence.enabled=false \
  -n events-app
```

### 7. Wait for MariaDB to be Ready
```bash
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=mariadb -n events-app --timeout=300s
```

### 8. Initialize the Database
```bash
kubectl apply -f kubernetes-configurations/db_init_job.yaml -n events-app
kubectl wait --for=condition=complete job/db-initializer -n events-app --timeout=60s
```

### 9. Deploy the Application
```bash
# Deploy API
kubectl apply -f kubernetes-configurations/api-deployment.yaml -n events-app
kubectl apply -f kubernetes-configurations/api-service.yaml -n events-app

# Deploy Website
kubectl apply -f kubernetes-configurations/web-deployment.yaml -n events-app
kubectl apply -f kubernetes-configurations/web-service.yaml -n events-app
```

### 10. Verify Deployment
```bash
kubectl get pods -n events-app
kubectl get services -n events-app
```

### 11. Access the Application

**Option A: Port Forward**
```bash
kubectl port-forward svc/events-web 8080:80 -n events-app
```
Then visit: `http://localhost:8080`

**Option B: Minikube Service**
```bash
minikube service events-web -n events-app
```
Opens the app automatically in your browser.

### 12. Cleanup
```bash
kubectl delete namespace events-app
minikube stop
```

---

## Building Docker Images and Pushing to Docker Hub

## Building Docker Images and Pushing to Docker Hub

### From an x64 Linux machine (e.g., Google Cloud Shell)
```bash
# Login to Docker Hub
docker login

# Build and push all three images
cd events-api
docker build -t drehnstrom/events-api:v2.0 .
docker push drehnstrom/events-api:v2.0

cd ../events-website
docker build -t drehnstrom/events-web:v2.0 .
docker push drehnstrom/events-web:v2.0

cd ../database-initializer
docker build -t drehnstrom/events-job:v2.0 .
docker push drehnstrom/events-job:v2.0
```

### From an Apple Silicon Mac (builds for both ARM64 and x64)

**Setup buildx once:**
```bash
# Unset Minikube Docker environment if active
eval $(minikube docker-env -u)

# Create multiplatform builder
docker buildx create --name multiplatform --use
docker buildx inspect --bootstrap
```

**Build and push:**
```bash
# Login to Docker Hub
docker login

# Build and push all three images for both platforms
cd events-api
docker buildx build --platform linux/amd64,linux/arm64 -t drehnstrom/events-api:v2.0 --push .

cd ../events-website
docker buildx build --platform linux/amd64,linux/arm64 -t drehnstrom/events-web:v2.0 --push .

cd ../database-initializer
docker buildx build --platform linux/amd64,linux/arm64 -t drehnstrom/events-job:v2.0 --push .
```

**Or use the automation script:**
```bash
cd automation
./mac-rebuild-docker-images.sh
```

---

## Deploying to Google Kubernetes Engine (GKE)

### Prerequisites
- Google Cloud Project with billing enabled
- gcloud CLI installed and configured
- kubectl installed

### Deploy
```bash
cd automation
./deploy-to-gke.sh
```

This script will:
1. Enable required Google Cloud APIs
2. Create a GKE cluster
3. Create the `events-app` namespace
4. Deploy MariaDB with Helm
5. Deploy all application services
6. Display external IP addresses

### Access the Application
After deployment completes, get the external IP:
```bash
kubectl get services -n events-app
```

Visit the `events-web` EXTERNAL-IP in your browser.

### Cleanup
```bash
cd automation
./uninstall-events-app.sh
```

---

## Local Development (without Docker/Kubernetes)

### Prerequisites
- Node.js 20+
- MySQL 5.7 running locally (or via Docker)

### Start MySQL with Docker
```bash
docker run --name events-mysql \
  -e MYSQL_ROOT_PASSWORD=letmein! \
  -e MYSQL_DATABASE=events_db \
  -p 3306:3306 \
  -d mysql:5.7
```

### Initialize Database
```bash
cd database-initializer
node server.js
```

### Start API Server
```bash
cd events-api
npm install
DBHOST=127.0.0.1 DBUSER=root DBPASSWORD=letmein! npm start
```

### Start Website
```bash
cd events-website
npm install
SERVER=http://localhost:8082 npm start
```

Visit: `http://localhost:8080`

---

## Architecture

- **events-api**: REST API for managing events (Node.js/Express + MySQL)
- **events-website**: Web UI for displaying and creating events (Node.js/Express + Handlebars)
- **database-initializer**: Kubernetes Job that creates database schema
- **MariaDB**: Database deployed via Helm chart

