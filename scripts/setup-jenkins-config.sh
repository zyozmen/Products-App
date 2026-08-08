#!/usr/bin/env bash
set -euo pipefail

# Este script prepara credenciales en Jenkins antes de ejecutar el pipeline.
# Debe correr desde la máquina/host que tenga acceso a Jenkins (tu laptop o el servidor Jenkins),
# no desde el contenedor Docker. El pipeline luego consumirá esas credenciales ya configuradas.

JENKINS_URL="${JENKINS_URL:-http://localhost:8090}"
JENKINS_USER="${JENKINS_USER:-admin}"
JENKINS_TOKEN="${JENKINS_TOKEN:-}"
OUTPUT_FILE="${OUTPUT_FILE:-}"
DRY_RUN="${DRY_RUN:-0}"
CREATE_CREDENTIALS="${CREATE_CREDENTIALS:-0}"

SONAR_CREDENTIAL_ID="${SONAR_CREDENTIAL_ID:-SONAR_TOKEN}"
AWS_ACCESS_KEY_CREDENTIAL_ID="${AWS_ACCESS_KEY_CREDENTIAL_ID:-aws-access-key-id}"
AWS_SECRET_ACCESS_KEY_CREDENTIAL_ID="${AWS_SECRET_ACCESS_KEY_CREDENTIAL_ID:-aws-secret-access-key}"

if [[ -z "$JENKINS_TOKEN" ]]; then
  echo "Debe definir JENKINS_TOKEN"
  exit 1
fi

CURL_BIN="$(command -v curl || true)"
PYTHON_BIN="$(command -v python3 || command -v python || true)"
if [[ -z "$CURL_BIN" ]]; then
  echo "curl no está instalado"
  exit 1
fi
if [[ -z "$PYTHON_BIN" ]]; then
  echo "python3 o python no está instalado"
  exit 1
fi

validate_required() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "ERROR: $name es obligatorio"
    exit 1
  fi
}

validate_url() {
  local value="$1"
  if [[ "$value" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]+)?(/.*)?$ ]]; then
    return 0
  fi
  echo "ERROR: $value no es una URL válida"
  exit 1
}

validate_aws_region() {
  local value="$1"
  if [[ "$value" =~ ^[a-z]{2}(-[a-z]+)+-[0-9]+$ ]]; then
    return 0
  fi
  echo "ERROR: $value no parece una región de AWS válida"
  exit 1
}

validate_account_id() {
  local value="$1"
  if [[ "$value" =~ ^[0-9]{12}$ ]]; then
    return 0
  fi
  echo "ERROR: $value no parece un AWS Account ID válido"
  exit 1
}

validate_s3_bucket() {
  local value="$1"
  if [[ "$value" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]]; then
    return 0
  fi
  echo "ERROR: $value no parece un nombre de bucket S3 válido"
  exit 1
}

validate_table_name() {
  local value="$1"
  if [[ "$value" =~ ^[A-Za-z0-9._-]{3,255}$ ]]; then
    return 0
  fi
  echo "ERROR: $value no parece un nombre de tabla DynamoDB válido"
  exit 1
}

print_summary() {
  echo "Valores a usar:"
  echo "- Jenkins URL: $JENKINS_URL"
  echo "- Sonar URL: $SONAR_HOST_URL"
  echo "- AWS Region: $AWS_REGION"
  echo "- AWS Account ID: $AWS_ACCOUNT_ID"
  echo "- S3 Bucket: $S3_BUCKET_NAME"
  echo "- Terraform State Bucket: $TERRAFORM_STATE_BUCKET"
  echo "- Terraform DynamoDB Table: $TERRAFORM_DYNAMO_TABLE"
}

write_env_file() {
  if [[ -z "$OUTPUT_FILE" ]]; then
    return 0
  fi

  cat > "$OUTPUT_FILE" <<EOF
export SONAR_HOST_URL="$SONAR_HOST_URL"
export SONAR_PROJECT_KEY="$SONAR_PROJECT_KEY"
export SONAR_PROJECT_NAME="$SONAR_PROJECT_NAME"
export SONAR_PROJECT_VERSION="$SONAR_PROJECT_VERSION"
export AWS_REGION="$AWS_REGION"
export AWS_ACCOUNT_ID="$AWS_ACCOUNT_ID"
export S3_BUCKET_NAME="$S3_BUCKET_NAME"
export TERRAFORM_STATE_BUCKET="$TERRAFORM_STATE_BUCKET"
export TERRAFORM_DYNAMO_TABLE="$TERRAFORM_DYNAMO_TABLE"
EOF
  echo "Archivo de entorno no sensible generado en $OUTPUT_FILE"
}

credential_exists() {
  local id="$1"
  local response

  response="$($CURL_BIN -sS -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/credentials/store/system/domain/_/api/json?tree=credentials[id]" 2>/dev/null || true)"
  if [[ -z "$response" ]]; then
    return 1
  fi

  if "$PYTHON_BIN" -c 'import json,sys; data=json.load(sys.stdin); creds=data.get("credentials", []); sys.exit(0 if any(c.get("id") == sys.argv[1] for c in creds) else 1)' "$id" <<<"$response"; then
    return 0
  fi

  return 1
}

create_secret() {
  local id="$1"
  local secret="$2"
  local description="$3"

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY RUN] Se usaría la credencial con ID: $id"
    return 0
  fi

  if [[ "$CREATE_CREDENTIALS" != "1" ]]; then
    if credential_exists "$id"; then
      echo "La credencial $id ya existe en Jenkins; no se creará una nueva."
      return 0
    fi

    echo "La credencial $id no existe en Jenkins y CREATE_CREDENTIALS=0, se omite."
    return 0
  fi

  validate_required "$id" "$secret"

  local crumb
  crumb="$($CURL_BIN -sS -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/crumbIssuer/api/json" | "$PYTHON_BIN" - <<'PY'
import json,sys
try:
    data=json.load(sys.stdin)
    print(data.get('crumb',''))
except Exception:
    pass
PY
)"

  local headers=()
  if [[ -n "$crumb" ]]; then
    headers+=( -H "Jenkins-Crumb: $crumb" )
  fi

  local payload
  payload="{\"\": \"0\", \"credentials\": {\"scope\": \"GLOBAL\", \"id\": \"$id\", \"secret\": \"$secret\", \"description\": \"$description\", \"$class\": \"org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl\"}}"

  "$CURL_BIN" -sS "${headers[@]}" -u "$JENKINS_USER:$JENKINS_TOKEN" \
    -X POST "$JENKINS_URL/credentials/store/system/domain/_/createCredentials" \
    --data-urlencode "json=$payload" \
    --data-urlencode 'Submit=OK' >/dev/null
}

if [[ "$CREATE_CREDENTIALS" == "1" ]]; then
  validate_required "SONAR_TOKEN" "${SONAR_TOKEN:-}"
  validate_required "AWS_ACCESS_KEY_ID" "${AWS_ACCESS_KEY_ID:-}"
  validate_required "AWS_SECRET_ACCESS_KEY" "${AWS_SECRET_ACCESS_KEY:-}"
fi

SONAR_HOST_URL="${SONAR_HOST_URL:-http://localhost:8070}"
SONAR_PROJECT_KEY="${SONAR_PROJECT_KEY:-products-frontend}"
SONAR_PROJECT_NAME="${SONAR_PROJECT_NAME:-Products Frontend}"
SONAR_PROJECT_VERSION="${SONAR_PROJECT_VERSION:-1.0}"
AWS_REGION="${AWS_REGION:-us-east-2}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-505231787824}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-ecommerce-frontend-bucket-prod}"
TERRAFORM_STATE_BUCKET="${TERRAFORM_STATE_BUCKET:-terraform-state-505231787824}"
TERRAFORM_DYNAMO_TABLE="${TERRAFORM_DYNAMO_TABLE:-terraform-locks}"

validate_url "$SONAR_HOST_URL"
validate_aws_region "$AWS_REGION"
validate_account_id "$AWS_ACCOUNT_ID"
validate_s3_bucket "$S3_BUCKET_NAME"
validate_s3_bucket "$TERRAFORM_STATE_BUCKET"
validate_table_name "$TERRAFORM_DYNAMO_TABLE"

print_summary
write_env_file

echo "Procesando credenciales de Jenkins..."
create_secret "$SONAR_CREDENTIAL_ID" "${SONAR_TOKEN:-}" "Token de SonarQube"
create_secret "$AWS_ACCESS_KEY_CREDENTIAL_ID" "${AWS_ACCESS_KEY_ID:-}" "AWS Access Key ID"
create_secret "$AWS_SECRET_ACCESS_KEY_CREDENTIAL_ID" "${AWS_SECRET_ACCESS_KEY:-}" "AWS Secret Access Key"

echo "Configuración de Jenkins lista."
