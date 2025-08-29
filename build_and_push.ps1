
if (-not $env:REGISTRY) {
    $env:REGISTRY = "docker-registry.ebrains.eu/workbench"
    Write-Host "Using default: $env:REGISTRY"
}

Write-Host "Building and pushing Docker image..."

docker build . -t "$env:REGISTRY/localiview:latest"

Write-Host "Built fine"

Write-Host "Pushing image"
docker push "$env:REGISTRY/localiview:latest"
