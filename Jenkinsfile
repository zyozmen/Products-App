pipeline {
    agent any

    environment {
        APP_NAME = 'products-frontend'
        APP_VERSION = "1.0.${BUILD_NUMBER}"

        // Configuración configurable desde Jenkins
        SONAR_HOST_URL = credentials('SONAR_HOST_URL') ?: 'http://localhost:8070'
        SONAR_PROJECT_KEY = 'products-frontend'
        SONAR_PROJECT_NAME = 'Products Frontend'
        SONAR_PROJECT_VERSION = '1.0'

        // AWS Config
        AWS_REGION = credentials('AWS_REGION') ?: 'us-east-2'
        AWS_ACCOUNT_ID = credentials('AWS_ACCOUNT_ID') ?: '505231787824'
        S3_BUCKET_NAME = credentials('S3_BUCKET_NAME') ?: 'ecommerce-frontend-bucket-prod'

        // Terraform backend config
        TERRAFORM_STATE_BUCKET = credentials('TERRAFORM_STATE_BUCKET') ?: 'terraform-state-505231787824'
        TERRAFORM_DYNAMO_TABLE = credentials('TERRAFORM_DYNAMO_TABLE') ?: 'terraform-locks'

        // Credentials IDs en Jenkins
        CRED_AWS_KEY_ID = 'aws-access-key-id'
        CRED_AWS_SECRET = 'aws-secret-access-key'
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        stage('Validate Jenkins Configuration') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        set -e
                        test -n "$SONAR_TOKEN" || { echo "Falta la credencial SONAR_TOKEN en Jenkins"; exit 1; }
                    '''
                }
            }
        }

        stage('Test & Coverage') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            agent {
                docker {
                    image 'node:20-alpine'
                }
            }
            steps {
                sh 'npm install --no-audit --no-fund'
                sh 'npm run test:coverage'
                sh 'npm run build'
                stash includes: 'build/**', name: 'build-artifacts'
            }
        }

        stage('SonarQube Static Analysis') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        set -e
                        echo "Ejecutando análisis de SonarQube..."
                        npm install --no-audit --no-fund
                        npm run test:coverage
                        npx sonar-scanner \
                            -Dsonar.host.url="$SONAR_HOST_URL" \
                            -Dsonar.login="$SONAR_TOKEN" \
                            -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
                            -Dsonar.projectName="$SONAR_PROJECT_NAME" \
                            -Dsonar.projectVersion="$SONAR_PROJECT_VERSION" \
                            -Dsonar.sources=src \
                            -Dsonar.tests=src \
                            -Dsonar.test.inclusions="src/**/*.test.js,src/**/*.test.jsx,src/**/*.test.ts,src/**/*.test.tsx" \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.exclusions="src/vendor/**,public/**"
                    '''
                }
            }
        }

        stage('Deploy Local Docker Environment') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    set -e
                    echo "Desplegando ambiente local con Docker para develop..."
                    docker compose -f docker-compose.dev.yml down --remove-orphans || true
                    docker compose -f docker-compose.dev.yml up -d --build
                    docker ps --filter "name=products-app" --format "table {{.Names}}\t{{.Status}}"
                '''
            }
        }

        stage('Provision Infrastructure (Terraform)') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: env.CRED_AWS_KEY_ID, variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: env.CRED_AWS_SECRET, variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        set -e

                        STATE_BUCKET="${TERRAFORM_STATE_BUCKET}"
                        DYNAMO_TABLE="${TERRAFORM_DYNAMO_TABLE}"

                        echo "=== 1. Verificando/Creando Backend Remoto en AWS (PRE-INIT) ==="

                        if ! aws s3api head-bucket --bucket "\$STATE_BUCKET" 2>/dev/null; then
                            echo "Bucket \$STATE_BUCKET no existe. Creando en ${env.AWS_REGION}..."

                            if [ "${env.AWS_REGION}" = "us-east-1" ]; then
                                aws s3api create-bucket --bucket "\$STATE_BUCKET" --region ${env.AWS_REGION}
                            else
                                aws s3api create-bucket \
                                    --bucket "\$STATE_BUCKET" \
                                    --region ${env.AWS_REGION} \
                                    --create-bucket-configuration LocationConstraint=${env.AWS_REGION}
                            fi

                            aws s3api put-bucket-versioning \
                                --bucket "\$STATE_BUCKET" \
                                --versioning-configuration Status=Enabled
                        else
                            echo "✓ Bucket \$STATE_BUCKET ya existe."
                        fi

                        if ! aws dynamodb describe-table --table-name "\$DYNAMO_TABLE" 2>/dev/null; then
                            echo "Tabla DynamoDB \$DYNAMO_TABLE no existe. Creando..."
                            aws dynamodb create-table \
                                --table-name "\$DYNAMO_TABLE" \
                                --attribute-definitions AttributeName=LockID,AttributeType=S \
                                --key-schema AttributeName=LockID,KeyType=HASH \
                                --billing-mode PAY_PER_REQUEST \
                                --region ${env.AWS_REGION}

                            aws dynamodb wait table-exists --table-name "\$DYNAMO_TABLE" --region ${env.AWS_REGION}
                        else
                            echo "✓ Tabla \$DYNAMO_TABLE ya existe."
                        fi

                        echo "=== 2. Aprovisionando Recursos con Terraform ==="
                        terraform init
                        terraform apply -auto-approve
                    """
                }
            }
        }

        stage('Deploy to AWS S3 Versioned') {
            when {
                branch 'main'
            }
            steps {
                unstash 'build-artifacts'

                withCredentials([
                    string(credentialsId: env.CRED_AWS_KEY_ID, variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: env.CRED_AWS_SECRET, variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    echo "Subiendo versión ${env.APP_VERSION} a S3..."
                    sh """
                        set -e
                        aws s3 sync build/ s3://${env.S3_BUCKET_NAME}/releases/${env.APP_VERSION}/ \
                            --region ${env.AWS_REGION}

                        aws s3 sync build/ s3://${env.S3_BUCKET_NAME}/live/ \
                            --region ${env.AWS_REGION} \
                            --delete
                    """
                }
            }
        }

        stage('Invalidate CloudFront Cache') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: env.CRED_AWS_KEY_ID, variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: env.CRED_AWS_SECRET, variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        set -e
                        DIST_ID=\$(terraform output -raw cloudfront_distribution_id)

                        echo "Creando invalidación en CloudFront ID: \$DIST_ID..."
                        aws cloudfront create-invalidation \
                            --distribution-id \$DIST_ID \
                            --paths "/*" \
                            --region ${env.AWS_REGION}
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completado con éxito.'
        }
        failure {
            echo 'El pipeline ha fallado. Revisa los logs.'
        }
    }
}