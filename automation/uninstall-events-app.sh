helm uninstall database-server
kubectl delete persistentvolumeclaim data-database-server-mariadb-0

kubectl delete -f ../kubernetes-configurations/
