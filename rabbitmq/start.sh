#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting RabbitMQ with MQTT support...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Navigate to the rabbitmq directory
cd "$(dirname "$0")"

# Stop any existing containers
echo -e "${YELLOW}Stopping any existing containers...${NC}"
docker-compose down

# Start the services
echo -e "${GREEN}Starting services...${NC}"
docker-compose up -d

# Wait for RabbitMQ to be ready
echo -e "${YELLOW}Waiting for RabbitMQ to be ready...${NC}"
sleep 5

# Check if RabbitMQ is running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ RabbitMQ is running${NC}"
    echo -e "${GREEN}✓ Management UI: http://localhost:15672${NC}"
    echo -e "${GREEN}✓ MQTT Port: 1883${NC}"
    echo -e "${GREEN}✓ Default credentials: admin/admin123${NC}"
    echo ""
    echo -e "${YELLOW}To view logs: docker-compose logs -f${NC}"
    echo -e "${YELLOW}To stop: docker-compose down${NC}"
else
    echo -e "${RED}Failed to start RabbitMQ${NC}"
    docker-compose logs
    exit 1
fi