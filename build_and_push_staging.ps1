if (-not $env:REGISTRY) {
    $env:REGISTRY = "docker-registry.ebrains.eu/workbench"
    Write-Host "Using default: $env:REGISTRY"
}

Write-Host "Building and pushing Docker image (staging)..."

docker build . --build-arg BUILD_MODE=staging -t "$env:REGISTRY/localiview:staging"

Write-Host "Built fine"

Write-Host "Pushing image"
docker push "$env:REGISTRY/localiview:staging"
