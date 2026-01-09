# Network Policies and RBAC Configuration

This directory contains RBAC (Role-Based Access Control) and Network Policy configurations for the Events App that demonstrate security best practices in Kubernetes.

## What's Included

### Service Accounts (`service-accounts.yaml`)
Defines explicit service accounts for the API and Web UI pods:
- `events-api` - Service account for API pods
- `events-web` - Service account for Web UI pods

### Network Policies (`network-policy-api.yaml`)
Demonstrates network-level access control:
- **events-api-allow-from-web**: Only allows ingress traffic to API pods from Web pods (pod-to-pod network isolation)
- **events-api-allow-to-database**: Allows API pods to make outbound connections to the database
- **events-web-allow-to-api**: Allows Web pods to communicate with the API

### RBAC (`roles.yaml`, `role-bindings.yaml`)
Demonstrates role-based access control for the Kubernetes API:
- **events-api-role**: Grants permission to read the database secret
- **events-web-role**: Grants minimal permissions for config map access
- **RoleBindings**: Bind roles to service accounts

## Important Notes

### Network Policy Limitations
The network policies use pod selectors with labels like `app: events-api` and `app: events-web`. These labels are set in the deployment metadata. However, **pod selector matching in network policies doesn't automatically match the service account name**.

To make the network policies work as intended, you should:

1. **Option 1**: Label pods with their service account (recommended for this demo)
   ```bash
   kubectl label pods -l app=events-api serviceaccount=events-api
   kubectl label pods -l app=events-web serviceaccount=events-web
   ```

2. **Option 2**: Use a mutating webhook to automatically label pods based on their service account (production approach)

3. **Option 3**: Modify the deployments to explicitly add labels:
   ```yaml
   spec:
     template:
       metadata:
         labels:
           app: events-api
           serviceaccount: events-api  # Add this
   ```

### Prerequisites

- Your Kubernetes cluster must have **Network Policies enabled**:
  - **Minikube**: `minikube start --network-policy=calico`
  - **GKE**: Create cluster with `--enable-network-policy`
  - **Other clusters**: Ensure a CNI plugin supporting network policies is installed (Calico, Cilium, Weave, etc.)

### Deployment Order

When deploying with RBAC enabled, deploy in this order:

```bash
# 1. Create namespace (if not default)
kubectl create namespace events-app

# 2. Deploy MariaDB with Helm (database)
helm install database-server bitnami/mariadb \
  --set auth.rootPassword=letmein! \
  --set primary.persistence.enabled=false \
  -n events-app

# 3. Create service accounts
kubectl apply -f kubernetes-configurations/service-accounts.yaml -n events-app

# 4. Create RBAC roles and bindings
kubectl apply -f kubernetes-configurations/roles.yaml -n events-app
kubectl apply -f kubernetes-configurations/role-bindings.yaml -n events-app

# 5. Create network policies
kubectl apply -f kubernetes-configurations/network-policy-api.yaml -n events-app

# 6. Deploy database initializer
kubectl apply -f kubernetes-configurations/db_init_job.yaml -n events-app

# 7. Deploy API and Web services
kubectl apply -f kubernetes-configurations/api-deployment.yaml -n events-app
kubectl apply -f kubernetes-configurations/api-service.yaml -n events-app
kubectl apply -f kubernetes-configurations/web-deployment.yaml -n events-app
kubectl apply -f kubernetes-configurations/web-service.yaml -n events-app
```

Or simply:
```bash
kubectl apply -f kubernetes-configurations/ -n events-app
```

### Verification

Check that resources are created:
```bash
# View service accounts
kubectl get serviceaccounts -n events-app

# View network policies
kubectl get networkpolicies -n events-app

# View RBAC roles and bindings
kubectl get roles -n events-app
kubectl get rolebindings -n events-app

# Check pod connectivity
kubectl exec -it <web-pod> -n events-app -- curl http://events-api:8082/events
```

## Teaching Points

This configuration demonstrates:
1. **Service Accounts**: Identity for pods in Kubernetes
2. **RBAC**: Fine-grained API permissions for service accounts
3. **Network Policies**: Pod-to-pod traffic control and isolation
4. **Principle of Least Privilege**: Services only have permissions they need
5. **Security Best Practices**: Multi-layer security (API level + network level)

## Troubleshooting

### Network Policy not working
- Verify your CNI plugin supports network policies
- Check that pod labels match your selectors: `kubectl get pods -L app`
- Ensure namespace is correct in policy specs

### RBAC "Forbidden" errors
- Verify the service account is properly bound to the role
- Check that API pod is using the correct service account: `kubectl get pod <pod-name> -o yaml | grep serviceAccountName`

### Pods can't communicate
- Check network policy rules allow egress/ingress
- Verify DNS is working: `kubectl exec -it <pod> -- nslookup kubernetes.default`
- Check service names: `kubectl get svc`
