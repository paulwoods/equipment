#!/bin/bash
# backup a postgres database
# keep 30 days worth of backups
#
# install with : crontab -e
# backup at 1am daily
# 0 1 * * 1 docker exec -t ~/equipment/backup.sh
#
docker exec -t equipment-postgres-1 pg_dumpall -U postgres | gzip > ~/equipment/sql/$(date -Iseconds).sql.gz
find ~/equipment/sql -type f -name "*.sql.gz" -mtime +30 -delete
