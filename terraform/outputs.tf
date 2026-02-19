output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Certificate authority data for EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_security_group_id" {
  description = "Security group ID for EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "node_group_arn" {
  description = "ARN of the EKS node group"
  value       = module.eks.eks_managed_node_groups["main"].arn
}

output "node_group_role_arn" {
  description = "ARN of the EKS node group IAM role"
  value       = module.eks.eks_managed_node_groups["main"].iam_role_arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of database subnet IDs"
  value       = module.vpc.database_subnets
}

output "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = module.vpc.natgw_ids
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc.igw_id
}

output "aws_auth_config_map_yaml" {
  description = "Formatted kubectl command to apply AWS ConfigMap"
  value       = module.eks.aws_auth_config_map_yaml
}

output "kubeconfig" {
  description = "kubectl config file contents for this cluster"
  value       = module.eks.kubeconfig
  sensitive   = true
}

output "configure_kubectl" {
  description = "Command to configure kubectl to connect to the cluster"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}

output "helm_releases" {
  description = "Deployed Helm releases"
  value       = {
    metrics-server          = var.enable_metrics_server ? helm_release.metrics_server[0].name : null
    aws-load-balancer-controller = var.enable_aws_load_balancer_controller ? helm_release.aws_load_balancer_controller[0].name : null
    external-dns            = var.enable_external_dns ? helm_release.external_dns[0].name : null
    cert-manager            = var.enable_cert_manager ? helm_release.cert_manager[0].name : null
    prometheus              = var.enable_prometheus ? helm_release.prometheus[0].name : null
    grafana                  = var.enable_grafana ? helm_release.grafana[0].name : null
    argocd                   = var.enable_argocd ? helm_release.argocd[0].name : null
  }
}

output "monitoring_endpoints" {
  description = "Endpoints for monitoring tools"
  value = {
    prometheus = var.enable_prometheus ? "http://prometheus.${var.domain_name}" : null
    grafana    = var.enable_grafana ? "https://grafana.${var.domain_name}" : null
  }
}
