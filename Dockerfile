# Stage 1: Build Vite frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot backend
FROM eclipse-temurin:25-jdk AS backend-builder
WORKDIR /app
COPY backend/mvnw backend/mvnw.cmd ./
COPY backend/.mvn ./.mvn
COPY backend/pom.xml ./
RUN ./mvnw dependency:go-offline -q
COPY backend/src ./src
COPY --from=frontend-builder /frontend/dist ./src/main/resources/static
RUN ./mvnw package -DskipTests -q

# Stage 3: Runtime
FROM eclipse-temurin:25-jre AS runner
RUN groupadd --gid 1001 spring && useradd --uid 1001 --gid spring spring
RUN mkdir /app /data && chown spring:spring /app /data
WORKDIR /app
COPY --from=backend-builder --chown=spring:spring /app/target/*.jar app.jar
USER spring
EXPOSE 8080
ENV APP_DATA_DIR=/data
HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
