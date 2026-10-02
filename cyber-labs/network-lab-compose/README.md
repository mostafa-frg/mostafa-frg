# Network Lab Compose

A reproducible local network sandbox using Docker Compose. It creates an isolated application network with two services so connectivity, DNS resolution, and service discovery can be tested without touching external hosts.

## Run
```bash
docker compose up -d
docker compose exec client wget -qO- http://web:80
docker compose down
```

The lab is intentionally local and disposable.
