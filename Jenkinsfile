pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'equipment-management'
        DOCKER_HUB_USER = 'yourusername' // Should be configured or passed as a parameter
        DOCKER_HUB_CREDENTIALS_ID = 'docker-hub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Extract Version') {
            steps {
                script {
                    def packageJson = readJSON file: 'package.json'
                    env.APP_VERSION = packageJson.version
                    echo "Building version: ${env.APP_VERSION}"
                }
            }
        }

        stage('Build & Test') {
            steps {
                sh 'npm install'
                sh 'npm run test'
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest ."
                sh "docker tag ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${env.APP_VERSION}"
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USER --password-stdin"
                    sh "docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:latest"
                    sh "docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${env.APP_VERSION}"
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
        success {
            echo "Successfully built and pushed ${DOCKER_IMAGE}:${env.APP_VERSION} to Docker Hub."
        }
        failure {
            echo "Pipeline failed. Please check the logs."
        }
    }
}
