# Installation & Verification

## Requirements
- Linux with Docker Engine
- Docker Compose v2

## Install
    docker compose config -q
    docker compose up -d

## Verify
    docker compose ps
    docker compose exec client wget -qO- http://web:80

## Stop
    docker compose down -v

This is an isolated local Docker network sandbox.
