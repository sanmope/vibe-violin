terraform {
  required_providers {
    minikube = {
      source  = "scott-the-programmer/minikube"
      version = "~> 0.4"
    }
  }
  required_version = ">= 1.0"
}

provider "minikube" {
  kubernetes_version = "v1.30.0"
}

resource "minikube_cluster" "vibe" {
  cluster_name = "vibe"
  driver       = "docker"
  cpus         = var.cpus
  memory       = var.memory

  addons = [
    "default-storageclass",
    "storage-provisioner",
    "metrics-server",
  ]
}
