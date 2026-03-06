variable "cpus" {
  description = "Number of CPUs allocated to the minikube cluster"
  type        = number
  default     = 2
}

variable "memory" {
  description = "Amount of memory (MB) allocated to the minikube cluster"
  type        = string
  default     = "4096"
}
