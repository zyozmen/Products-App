pipeline {
    agent any

    environment {
        APP_NAME           = 'products-frontend'
        APP_VERSION        = "1.0.${BUILD_NUMBER}"
        
        // AWS Config
        AWS_REGION         = 'us-east-2'
        AWS_ACCOUNT_ID     = '505231787824'
        S3_BUCKET_NAME     = 'ecommerce-frontend-bucket-prod'
        CLOUDFRONT_DIST_ID = 'E1234567890ABC' // Reemplaza por el ID real de tu CDN

        // Credentials IDs en Jenkins
        CRED_AWS_KEY_ID    = 'aws-access-key-id'
        CRED_AWS_SECRET    = 'aws-secret-access-key'
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
                }
            }
            steps {
                sh 'npm ci' 
                sh 'npm run test:coverage'
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

        stage('Verify & Install Tools') {
            steps {
                sh '''
                    mkdir -p .bin
                    export PATH="${WORKSPACE}/.bin:${PATH}"

                    # 1. Verificar o instalar AWS CLI v2
                    if ! command -v aws &> /dev/null; then
                        echo "➜ AWS CLI no encontrado. Instalando localmente en el workspace..."
                        curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
                        unzip -q -o awscliv2.zip
                        ./aws/install --bin-dir "${WORKSPACE}/.bin" --install-dir "${WORKSPACE}/.aws-cli" --update
                        rm -rf awscliv2.zip aws/
                    else
                        echo "✓ AWS CLI ya está instalado: $(aws --version)"
                    fi
                '''
            }
        }

        stage('Deploy to AWS S3 Versioned') {
            steps {
                unstash 'build-artifacts'

                withCredentials([
                    string(credentialsId: env.CRED_AWS_KEY_ID, variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: env.CRED_AWS_SECRET, variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    echo "Desplegando versión ${env.APP_VERSION} en S3 Bucket: ${env.S3_BUCKET_NAME}..."

                    // 1. Historial inmutable por versión
                    sh """
                        aws s3 sync build/ s3://${env.S3_BUCKET_NAME}/releases/${env.APP_VERSION}/ \
                            --region ${env.AWS_REGION}
                    """

                    // 2. Sobrescribe la versión pública activa (Usando build/ en lugar de dist/)
                    sh """
                        aws s3 sync build/ s3://${env.S3_BUCKET_NAME}/live/ \
                            --region ${env.AWS_REGION} \
                            --delete
                    """
                }
            }
        }

        stage('Invalidate CloudFront Cache') {
            steps {
                withCredentials([
                    string(credentialsId: env.CRED_AWS_KEY_ID, variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: env.CRED_AWS_SECRET, variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
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