# Installation & Verification

## Requirements
- Linux with Docker Engine
- Docker Compose v2
- At least 2 GB free RAM recommended

## Install and start
    docker compose -f docker-compose.yml config -q
    docker compose up -d

## Verify
    docker compose ps
    docker compose logs --no-color --tail=100
    python3 -m unittest discover -s tests -p 'test_*.py' -v

The lab uses an isolated Docker network for local network-operations practice.

## Stop and clean
    docker compose down
    docker compose down -v

## Troubleshooting
- Confirm Docker is running with: docker info
- Resolve Docker subnet conflicts before starting.
- Do not publish lab services to the public internet.
