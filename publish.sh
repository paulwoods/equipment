docker build -t equipment-management .
docker tag equipment-management paulwoods/equipment-management:0.2.0
docker tag equipment-management paulwoods/equipment-management:latest
docker push paulwoods/equipment-management:0.2.0
docker push paulwoods/equipment-management:latest
