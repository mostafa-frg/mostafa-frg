# DHCP / DNS Lab

Isolated Docker DNS troubleshooting lab.

## Run
```bash
docker compose up -d
docker compose exec client nslookup lab.test
docker compose exec client cat /etc/resolv.conf
docker compose down
```

The network is Docker-internal and does not require access to real infrastructure.
