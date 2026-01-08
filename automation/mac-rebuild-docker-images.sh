#!/bin/bash

# Mac version: Build and push multi-platform Docker images (AMD64 + ARM64)
# Requires: docker buildx with multiplatform builder
# Usage: ./mac-rebuild-docker-images.sh

set -e  # Exit on error

echo "Building and pushing multi-platform Docker images..."
echo ""

# Ensure we're using the multiplatform builder
if ! docker buildx ls | grep -q multiplatform; then
    echo "Creating multiplatform builder..."
    docker buildx create --name multiplatform --use
    docker buildx inspect --bootstrap
fi

# Use the multiplatform builder
docker buildx use multiplatform

# Build and push API
echo "Building API: drehnstrom/events-api:v2.0"
docker buildx build --platform linux/amd64,linux/arm64 -t drehnstrom/events-api:v2.0 --push ../events-api

# Build and push Website
echo "Building Website: drehnstrom/events-web:v2.0"
docker buildx build --platform linux/amd64,linux/arm64 \
    -t drehnstrom/events-web:v2.0 \
    --build-arg buildtime="$(date)" \
    --push ../events-website

# Build and push Database Initializer
echo "Building Database Initializer: drehnstrom/events-job:v2.0"
docker buildx build --platform linux/amd64,linux/arm64 -t drehnstrom/events-job:v2.0 --push ../database-initializer

echo ""
echo "✓ All images built and pushed successfully!"
echo ""
echo "Images available for:"
echo "  - Apple Silicon Macs (linux/arm64)"
echo "  - Intel Macs (linux/amd64)"
echo "  - GKE and other x64 Linux environments"
