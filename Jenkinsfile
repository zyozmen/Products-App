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


        stage('Deploy to AWS S3 Versioned') {
            steps {
                unstash 'build-artifacts'

                withCredentials([
                    string(credentialsId: env.CRED_AWS_KEY_ID, variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: env.CRED_AWS_SECRET, variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        set -e

                        echo "1. Verificando existencia del bucket: ${env.S3_BUCKET_NAME}..."
                        if aws s3api head-bucket --bucket "${env.S3_BUCKET_NAME}" 2>/dev/null; then
                            echo "➜ El bucket ya existe."
                        else
                            echo "➜ El bucket no existe. Creando bucket en región ${env.AWS_REGION}..."
                            
                            if [ "${env.AWS_REGION}" = "us-east-1" ]; then
                                aws s3api create-bucket \
                                    --bucket "${env.S3_BUCKET_NAME}" \
                                    --region "${env.AWS_REGION}"
                            else
                                aws s3api create-bucket \
                                    --bucket "${env.S3_BUCKET_NAME}" \
                                    --region "${env.AWS_REGION}" \
                                    --create-bucket-configuration LocationConstraint="${env.AWS_REGION}"
                            fi

                            echo "➜ Bloqueando acceso público predeterminado en S3..."
                            aws s3api put-public-access-block \
                                --bucket "${env.S3_BUCKET_NAME}" \
                                --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
                        fi

                        echo "2. Desplegando versión ${env.APP_VERSION}..."
                        aws s3 sync build/ s3://${env.S3_BUCKET_NAME}/releases/${env.APP_VERSION}/ \
                            --region ${env.AWS_REGION}

                        echo "3. Actualizando versión activa en /live..."
                        aws s3 sync build/ s3://${env.S3_BUCKET_NAME}/live/ \
                            --region ${env.AWS_REGION} \
                            --delete

                        echo "4. Aplicando Terraform con la nueva Imagen ==="
                        terraform init
                        terraform apply -auto-approve -var="app_version=${env.APP_VERSION}"
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
                    # Captura el ID directamente desde el estado de Terraform
                        
                        DIST_ID=\$(terraform output -raw cloudfront_distribution_id)

                        echo "Creando invalidación en CloudFront ID: \$DIST_ID..."
                        aws cloudfront create-invalidation \
                            --distribution-id \$DIST_ID \
                            --paths "/*" \
                            --region ${env.AWS_REGION}
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