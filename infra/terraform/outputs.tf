output "cluster_name" {
  description = "Name of the minikube cluster"
  value       = minikube_cluster.vibe.cluster_name
}

output "client_certificate" {
  description = "Client certificate for cluster authentication"
  value       = minikube_cluster.vibe.client_certificate
  sensitive   = true
}
