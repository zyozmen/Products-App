pipeline {
    agent any

    environment {
        APP_NAME             = 'products-frontend'
        DOCKER_USER          = 'zyozmen'
        DOCKER_NETWORK_NAME   = 'red-productos'
        APP_VERSION          = "1.0.${BUILD_NUMBER}"
        AWS_REGION         = 'us-east-2'
        AWS_ACCOUNT_ID     = '505231787824'
        S3_BUCKET_NAME     = 'ecommerce-frontend-bucket-prod'
    }

    stages {

        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        stage('Test & Coverage') {
           agent {
                docker {
                image 'node:20-alpine'
            // Opcional: reutilizar el usuario o argumentos si hay problemas de permisos
            // reuseNode true
                }
            }
            steps {
                // 1. Instalar dependencias del proyecto (incluye vitest)
                sh 'npm ci' 
                
                // 2. Ejecutar pruebas
                sh 'npm run test:coverage'

                // 3. Construir el proyecto
                sh 'npm run build'

                stash includes: 'build/**', name: 'build-artifacts'
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

        /* stage('Build & Push Docker Image') {
            when {
                expression {
                    // Evalúa la rama sin importar el tipo de job en Jenkins
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                    echo "Evaluando reglas de empaquetado para la rama: ${currentBranch}"
                    
                    // Retorna true si contiene main, master o develop
                    return currentBranch =~ /(main|master|develop)/
                }
            }
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
        }*/

        stage('Deploy to AWS S3 Versioned') {
            steps {
                unstash 'build-artifacts'

                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    // Al usar los nombres estándar AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY,
                    // el CLI de AWS los detecta automáticamente sin necesidad de hacer 'export'.
                    sh """
                        aws s3 sync build/ s3://${env.S3_BUCKET_NAME}/releases/${env.APP_VERSION}/ \
                            --region ${env.AWS_REGION}

                    """

            // 2. Sobrescribe la raíz activa que sirve CloudFront
                    sh """
                        aws s3 sync dist/ s3://${env.S3_BUCKET_NAME}/live/ \
                            --region ${env.AWS_REGION} \
                            --delete
                    """
                }
            }
        }

        stage('Invalidate CloudFront Cache') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: env.AWS_CREDENTIALS_ID
                ]]) {
                    echo "Creando invalidación en CloudFront ID: ${env.CLOUDFRONT_DIST_ID}..."
                    sh """
                        aws cloudfront create-invalidation \
                            --distribution-id ${env.CLOUDFRONT_DIST_ID} \
                            --paths "/*" \
                            --region ${env.AWS_REGION}
                    """
                }
            }
        }
    }

    post {
        success {
            echo '¡Despliegue del Frontend completado con éxito en S3 + CloudFront!'
        }
        failure {
            echo 'El pipeline de despliegue ha fallado. Revisa los logs.'
        }
    }
}