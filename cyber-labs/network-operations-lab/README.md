# Network Operations Lab

A reproducible network-operations environment for topology design, service discovery, health checks, configuration validation, and incident-style reporting.

Architecture:
- edge — Alpine router-like container
- web01 — Nginx service
- dns01 — DNS service
- monitor — Python health-check runner
- isolated Docker bridge: 10.60.0.0/24

Start:
docker compose up -d
docker compose ps
docker compose exec monitor python /opt/lab/healthcheck.py
docker compose down

The lab is isolated to Docker networking and does not modify the host routing table or scan external systems.
