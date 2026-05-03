#!/bin/bash
docker exec -i equipment-postgres-1 psql -U postgres -d postgres -v ON_ERROR_STOP=1 < text.sql
