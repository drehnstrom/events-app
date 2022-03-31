# Recreate API Docker Containers
docker build -t drehnstrom/events-api:v1.0 ../events-api
docker push drehnstrom/events-api:v1.0

# Recreate Website Docker Containers
docker build -t drehnstrom/events-web:v1.0 --build-arg buildtime="$(date)" ../events-website
docker push drehnstrom/events-web:v1.0

# Recreate DV Initializer Docker Containers
docker build -t drehnstrom/events-job:v1.0 ../database-initializer
docker push drehnstrom/events-job:v1.0