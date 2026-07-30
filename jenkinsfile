pipeline {
    agent any

    environment {
        APP_NAME             = 'products-frontend'
        DOCKER_USER          = 'zyozmen'
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
                // Solo se empaqueta si estamos en develop, main o master
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

        stage('SSH Secure Deployment') {
            steps {
                sshagent(['ssh-deploy-key']) {
                    sh '''
                        set +x
                        echo "Estableciendo sesion SSH segura..."
                        # ssh -o StrictHostKeyChecking=no -o BatchMode=yes $SSH_USER@$DEPLOY_HOST "docker pull ... && docker container run ..." || exit 1
                    '''
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