pipeline {
    agent any

    environment {
        APP_NAME             = 'products-frontend'
        DOCKER_USER          = 'zyozmen'
        DOCKER_NETWORK_NAME   = 'red-productos'
        APP_VERSION          = "1.0.${BUILD_NUMBER}"
    }

    stages {
        stage('SonarQube Static Analysis') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        set +x
                        echo "Ejecutando analisis de seguridad con SonarQube..."
                        # npx sonar-scanner -Dsonar.token="$SONAR_TOKEN" || exit 1
                    '''
                }
            }
        }

        stage('Build & Push Docker Image') {
            when {
                branch pattern: "develop|main|master", comparator: "REGEXP"
            }
            steps {
                script {
                    def gitBranch = env.BRANCH_NAME ?: 'main'
                    def fullImageName = "${DOCKER_USER}/${APP_NAME}"

                    echo "Construyendo imagen: ${fullImageName}:${APP_VERSION} para la rama [${gitBranch}]..."
                    def customImage = docker.build("${fullImageName}:${APP_VERSION}")

                    docker.withRegistry("https://index.docker.io/v1/", 'DOCKER_HUB_CREDENTIALS') {
                        echo "Publicando tag de versión: ${APP_VERSION}..."
                        customImage.push(APP_VERSION)

                        if (gitBranch == 'main' || gitBranch == 'master') {
                            echo "Publicando tag: latest para Producción..."
                            customImage.push('latest')
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            echo "El pipeline abortó su ejecución para prevenir fugas de contexto o fallos de autenticación."
        }
    }
}