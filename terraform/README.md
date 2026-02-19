# Mindelta AWS Infrastructure

This Terraform configuration deploys a complete AWS EKS infrastructure for the Mindelta learning platform.

## 🏗 **Architecture Overview**

### **Components Deployed:**
- **EKS Cluster** (Kubernetes 1.28) with managed node groups
- **VPC** with public, private, and database subnets
- **Security Groups** for cluster, nodes, ALB, RDS, and ElastiCache
- **Storage**: RDS MySQL, ElastiCache Redis, S3 buckets, EFS
- **Monitoring**: CloudWatch, Prometheus, Grafana, alarms
- **Networking**: Application Load Balancer, External DNS, cert-manager
- **Security**: IAM roles, encryption, network policies

## 📋 **Prerequisites**

### **Required Tools:**
```bash
# Terraform
terraform --version  # >= 1.0

# AWS CLI
aws --version

# kubectl
kubectl version --client

# Configure AWS credentials
aws configure
```

### **AWS Permissions:**
- Administrator access or equivalent IAM permissions
- Permission to create IAM roles and policies
- Permission to manage VPC, EKS, RDS, ElastiCache, S3

## 🚀 **Quick Start**

### **1. Clone and Navigate:**
```bash
cd terraform
```

### **2. Copy Variables:**
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your specific values
```

### **3. Initialize Terraform:**
```bash
terraform init
```

### **4. Plan the Deployment:**
```bash
terraform plan
```

### **5. Deploy Infrastructure:**
```bash
terraform apply
```

### **6. Configure kubectl:**
```bash
aws eks update-kubeconfig --name $(terraform output -raw cluster_name) --region $(terraform output -raw aws_region)
```

### **7. Verify Deployment:**
```bash
kubectl get nodes
kubectl get pods -A
```

## 📊 **Infrastructure Components**

### **EKS Cluster**
- **Version**: Kubernetes 1.28
- **Node Groups**: Managed with auto-scaling (3-10 nodes)
- **Instance Types**: t3.medium, t3.large
- **Add-ons**: CoreDNS, kube-proxy, VPC CNI, EBS CSI Driver

### **Networking**
- **VPC**: 10.0.0.0/16 with 3 AZs
- **Subnets**: 
  - Private (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
  - Public (10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24)
  - Database (10.0.201.0/24, 10.0.202.0/24)
- **Security Groups**: Isolated for each component
- **NAT Gateways**: One per AZ for outbound internet access

### **Storage**
- **RDS MySQL**: Multi-AZ, encrypted, automated backups
- **ElastiCache Redis**: Multi-AZ, encrypted, auth token
- **S3 Buckets**: Encrypted, versioned, lifecycle policies
- **EFS**: Shared file system for persistent storage

### **Monitoring & Observability**
- **CloudWatch**: Logs, metrics, dashboards, alarms
- **Prometheus**: Application metrics collection
- **Grafana**: Visualization dashboards
- **X-Ray**: Distributed tracing (optional)

### **Security**
- **IAM Roles**: Service accounts with least privilege
- **Encryption**: At rest and in transit
- **Network Policies**: Pod-to-pod communication control
- **Secrets Management**: AWS Secrets Manager integration

## 🔧 **Configuration**

### **Key Variables:**
```hcl
# Project settings
project_name = "mindelta"
environment  = "production"
aws_region   = "us-east-1"

# Cluster sizing
min_size     = 3
max_size     = 10
desired_size = 3

# Feature toggles
enable_prometheus = true
enable_grafana    = true
enable_argocd     = false
```

### **Customization:**
- Modify `terraform.tfvars` for environment-specific settings
- Adjust instance types and node counts based on workload
- Enable/disable features as needed

## 📈 **Cost Optimization**

### **Included Optimizations:**
- **Spot Instances**: Can be enabled for cost savings
- **Auto-scaling**: Scale based on demand
- **Storage Classes**: S3 lifecycle policies for cost tiers
- **Reserved Instances**: Consider for production workloads

### **Estimated Monthly Costs:**
- **EKS Cluster**: ~$73/month
- **EKS Nodes**: ~$150/month (3x t3.medium)
- **RDS MySQL**: ~$100/month
- **ElastiCache Redis**: ~$50/month
- **Load Balancer**: ~$25/month
- **Data Transfer**: ~$20/month
- **Total**: ~$418/month (varies by usage)

## 🔍 **Monitoring & Alerts**

### **CloudWatch Dashboards:**
- EKS cluster metrics
- RDS performance
- ElastiCache statistics
- Application Load Balancer metrics

### **Automated Alerts:**
- High CPU/Memory utilization
- Database connection issues
- Redis memory pressure
- Application errors

### **Log Aggregation:**
- Application logs: `/aws/eks/<cluster>/application`
- System logs: `/aws/eks/<cluster>/system`
- Component logs: RDS, ElastiCache, ALB

## 🛠 **Management Commands**

### **Scaling:**
```bash
# Scale node group
terraform apply -var="desired_size=5"

# Enable cluster autoscaler
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/download/cluster-autoscaler-1.28.0/cluster-autoscaler.yaml
```

### **Updates:**
```bash
# Update EKS version
terraform apply -var="cluster_version=1.29"

# Update node instance types
terraform apply -var="instance_types=[\"t3.large\"]"
```

### **Monitoring:**
```bash
# Check cluster status
kubectl cluster-info

# View node resources
kubectl top nodes

# View pod resources
kubectl top pods -A

# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80
```

## 🔄 **GitOps Integration**

### **ArgoCD (Optional):**
```hcl
enable_argocd = true
```

### **Application Deployment:**
```bash
# Deploy applications via ArgoCD
kubectl apply -f ../k8s/argocd-apps/
```

## 🧪 **Testing**

### **Connectivity Tests:**
```bash
# Test database connectivity
kubectl run mysql-client --image=mysql:8.0 --rm -it -- mysql -h <rds-endpoint> -u <username> -p

# Test Redis connectivity
kubectl run redis-client --image=redis:7 --rm -it -- redis-cli -h <redis-endpoint>
```

### **Load Testing:**
```bash
# Install k6 for load testing
kubectl apply -f https://raw.githubusercontent.com/grafana/k6-operator/main/config/crd/bases/k6.io_k6s.yaml
```

## 🚨 **Troubleshooting**

### **Common Issues:**

**Node Group Scaling:**
```bash
# Check node group status
aws eks describe-nodegroup --cluster-name <cluster> --nodegroup-name <group>

# Check scaling activities
aws autoscaling describe-scaling-activities --auto-scaling-group-name <asg-name>
```

**Database Connectivity:**
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connectivity from pod
kubectl exec -it <pod-name> -- nc -zv <rds-endpoint> 3306
```

**Load Balancer Issues:**
```bash
# Check ALB target groups
aws elbv2 describe-target-groups --names <tg-name>

# Check target health
aws elbv2 describe-target-health --target-group-arn <tg-arn>
```

### **Logs and Debugging:**
```bash
# EKS control plane logs
aws logs describe-log-groups --log-group-name-prefix /aws/eks

# Node logs
ssh -i <key-pair> ec2-user@<node-ip> "sudo journalctl -u kubelet"

# Pod logs
kubectl logs -f <pod-name> -n <namespace>
```

## 🔄 **Maintenance**

### **Regular Tasks:**
- Review and update Terraform modules
- Monitor AWS service quotas and limits
- Update Kubernetes versions quarterly
- Review security group rules
- Backup and test disaster recovery

### **Security Updates:**
```bash
# Update EKS AMI
terraform apply -var="cluster_version=latest"

# Update RDS minor version
aws rds modify-db-instance --db-instance-identifier <db> --apply-immediately --allow-major-version-upgrade
```

## 📚 **Documentation**

- [EKS User Guide](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)

## 🆘 **Support**

For infrastructure issues:
1. Check CloudWatch logs and metrics
2. Review Terraform state and configuration
3. Consult AWS service health dashboard
4. Contact AWS support for service-specific issues

---

**This infrastructure provides a production-ready foundation for the Mindelta learning platform with high availability, security, and observability built-in.** 🚀
