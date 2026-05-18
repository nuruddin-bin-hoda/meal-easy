#!/bin/bash
# Usage: ./scripts/set-ip.sh 192.168.1.105
# Updates MAC_IP in root .env automatically

if [ -z "$1" ]; then
  # Auto-detect Mac's local IP
  IP=$(ipconfig getifaddr en0)
  if [ -z "$IP" ]; then
    IP=$(ipconfig getifaddr en1)
  fi
else
  IP=$1
fi

if [ -z "$IP" ]; then
  echo "Could not detect IP. Usage: ./scripts/set-ip.sh <ip>"
  exit 1
fi

# Update MAC_IP in .env
sed -i '' "s/^MAC_IP=.*/MAC_IP=$IP/" .env

echo "MAC_IP updated to: $IP"
echo "Restart Docker for changes to take effect:"
echo "  docker compose -f docker-compose.yml -f docker-compose.dev.yml down"
echo "  docker compose -f docker-compose.yml -f docker-compose.dev.yml up"
