docker build -t equipment-management .
docker tag equipment-management paulwoods/equipment-management:latest
docker tag equipment-management paulwoods/equipment-management:0.1.5
docker push paulwoods/equipment-management:latest
docker push paulwoods/equipment-management:0.1.5
