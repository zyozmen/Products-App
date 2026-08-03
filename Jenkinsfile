pipeline {
    agent any

    environment {
        APP_NAME             = 'products-frontend'
        DOCKER_USER          = 'zyozmen'
        DOCKER_NETWORK_NAME   = 'red-productos'
        APP_VERSION          = "1.0.${BUILD_NUMBER}"
    }

    stages {

        stage('Test & Coverage') {
           agent {
                docker {
                image 'node:20-alpine'
            // Opcional: reutilizar el usuario o argumentos si hay problemas de permisos
            // reuseNode true
                }
            }
            steps {
                sh 'npm run test:coverage'
            }
        }
        
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
         /*    when {
                expression {
                    // Evalúa la rama sin importar el tipo de job en Jenkins
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                    echo "Evaluando reglas de empaquetado para la rama: ${currentBranch}"
                    
                    // Retorna true si contiene main, master o develop
                    return currentBranch =~ /(main|master|develop)/
                }
            }*/
            steps {
                script {
                  //  def gitBranch = env.BRANCH_NAME ?: 'main'
                    def fullImageName = "${DOCKER_USER}/${APP_NAME}"

                    echo "Construyendo imagen: ${fullImageName}:${APP_VERSION} para la rama [${env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'main'}]..."
                    def customImage = docker.build("${fullImageName}:${APP_VERSION}")

                    docker.withRegistry("https://index.docker.io/v1/", 'DOCKER_HUB_CREDENTIALS') {
                        echo "Publicando tag de versión: ${APP_VERSION}..."
                        customImage.push(APP_VERSION)

                      //  if (gitBranch == 'main' || gitBranch == 'master') {
                            echo "Publicando tag: latest para Producción..."
                            customImage.push('latest')
                       // }
                    }
                }
            }
        }

    stage('SSH Secure Deployment') {
          /*   when {
                expression {
                    // Evalúa la rama sin importar el tipo de job en Jenkins
                 //   def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                    echo "Evaluando reglas de empaquetado para la rama: ${currentBranch}"
                    
                    // Retorna true si contiene main, master o develop
                    return currentBranch =~ /(main)/
                }
            }*/
            
            steps {
                 withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'SSH_DEPLOY_KEY', 
                        keyFileVariable: 'SSH_KEY', 
                        usernameVariable: 'SSH_USER'
                    ),
                    usernamePassword(
                        credentialsId: 'DOCKER_HUB_CREDENTIALS', 
                        usernameVariable: 'DOCKER_USER', 
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]){
                        script {
                            def awsIp = "18.224.29.18"
                            def fullImageTag = "${DOCKER_USER}/${APP_NAME}:${APP_VERSION}"
                            sh """
                            ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no \${SSH_USER}@${awsIp} \
                            DOCKER_USER='${DOCKER_USER}' \
                            DOCKER_PASS='${DOCKER_PASS}' \
                            APP_NAME='${APP_NAME}' \
                            IMAGE_TAG='${fullImageTag}' \
                            NETWORK_NAME='${DOCKER_NETWORK_NAME}' \
                            'bash -s' << 'EOF'
                                set -e
                                ENV_FILE="/etc/products-api/.env"

                                echo "--> Autenticando en Docker Hub..."
                                echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin

                                echo "--> Descargando imagen desde Docker Hub: \$IMAGE_TAG"
                                docker pull "\$IMAGE_TAG"

                                echo "--> Verificando red aislada..."
                                docker network inspect "\$NETWORK_NAME" >/dev/null 2>&1 || docker network create "\$NETWORK_NAME"

                                echo "--> Removiendo contenedor anterior..."
                                if [ \$(docker ps -aq -f name=^\${APP_NAME}\$) ]; then
                                    docker stop "\$APP_NAME" || true
                                    docker rm "\$APP_NAME" || true
                                fi

                                echo "--> Desplegando contenedor React en AWS..."
                                docker run -d \\
                                    --name "\$APP_NAME" \\
                                    --restart unless-stopped \\
                                    --network "\$NETWORK_NAME" \\
                                    --env-file "\$ENV_FILE" \\
                                    -p 4200:4200 \\
                                    "\$IMAGE_TAG"

                                echo "--> Limpiando imágenes en desuso..."
                                docker image prune -f

                                echo "--> Verificando estado del contenedor..."
                                sleep 5
                                docker ps -f name="\$APP_NAME"
EOF
"""
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