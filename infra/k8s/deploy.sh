#!/bin/bash
set -e

echo "=== Vibe K8s Deployment ==="

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl not found. Install it first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "Error: docker not found. Install it first."
    exit 1
fi

# Build frontend image
echo ""
echo "[1/6] Building frontend Docker image..."
docker build -t vibe-frontend:latest ../../frontend/

# Create namespace
echo ""
echo "[2/6] Creating namespace..."
kubectl apply -f namespace.yml

# Install cert-manager if not present
echo ""
echo "[3/6] Installing cert-manager..."
if ! kubectl get namespace cert-manager &> /dev/null; then
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.17.1/cert-manager.yaml
    echo "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=120s
    kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=120s
    kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=120s
    # Give webhook a moment to start serving
    sleep 5
else
    echo "cert-manager already installed, skipping."
fi

# Deploy CA chain and certificates
echo ""
echo "[4/6] Setting up mTLS certificates..."
kubectl apply -f cert-manager-issuer.yml
echo "Waiting for root CA certificate to be ready..."
kubectl wait --for=condition=Ready certificate/vibe-root-ca -n vibe --timeout=120s

kubectl apply -f frontend-certificate.yml
kubectl apply -f nginx-certificate.yml
echo "Waiting for workload certificates to be ready..."
kubectl wait --for=condition=Ready certificate/frontend-cert -n vibe --timeout=120s
kubectl wait --for=condition=Ready certificate/nginx-cert -n vibe --timeout=120s
echo "All certificates issued successfully."

# Deploy infrastructure (postgres, redis)
echo ""
echo "[5/6] Deploying infrastructure..."
kubectl apply -f postgres-secret.yml
kubectl apply -f postgres-deployment.yml
kubectl apply -f redis-deployment.yml

# Deploy application (frontend + nginx + HPA)
echo ""
echo "[6/6] Deploying application..."
kubectl apply -f frontend-nginx-configmap.yml
kubectl apply -f frontend-deployment.yml
kubectl apply -f frontend-hpa.yml
kubectl apply -f nginx-configmap.yml
kubectl apply -f nginx-deployment.yml

# Wait for rollout
echo ""
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/frontend -n vibe --timeout=120s
kubectl rollout status deployment/nginx -n vibe --timeout=120s

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Access the app at: http://localhost:30080"
echo ""
echo "Verify mTLS:"
echo "  kubectl get certificates -n vibe              # Check cert status"
echo "  kubectl exec -it deploy/nginx -n vibe -- sh   # Shell into nginx to test"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n vibe                    # List pods"
echo "  kubectl get hpa -n vibe                     # Check autoscaler status"
echo "  kubectl top pods -n vibe                    # Resource usage (requires metrics-server)"
echo "  kubectl scale deploy/frontend -n vibe --replicas=5  # Manual scale"
echo "  kubectl logs -f deploy/nginx -n vibe        # Nginx logs"
