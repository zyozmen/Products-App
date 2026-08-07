terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Configuración del Backend Remoto Compartido
  backend "s3" {
    bucket         = "terraform-state-505231787824"
    key            = "frontend/products-app/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-2"
}

# 1. Bucket S3 Privado para el Frontend
resource "aws_s3_bucket" "frontend" {
  bucket = "ecommerce-frontend-bucket-prod"
}

# 2. Bloqueo de acceso público directo a S3
resource "aws_s3_bucket_public_access_block" "frontend_block" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 3. CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "frontend-s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 4. Distribución de CloudFront con Doble Origen (S3 + ALB)
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"

  # Origen 1: S3 para los estáticos del Frontend
  origin {
    domain_name              = "products-api-alb-1106728675.us-east-2.elb.amazonaws.com"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
    origin_id                = "S3-Frontend"
    origin_path              = "/live"
  }

  # Origen 2: ALB para las llamadas de la API de ECS
  origin {
    # REEMPLAZA esta línea con el DNS real de tu ALB (output alb_dns_name del backend)
    domain_name = "products-api-alb-123456789.us-east-2.elb.amazonaws.com" 
    origin_id   = "ALB-Backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Comportamiento por defecto: todo va a S3 (React)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Comportamiento prioritario: peticiones /api/* van al ALB de ECS
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-Backend"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Accept"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# 5. Política en S3 para permitir acceso exclusivo a CloudFront vía OAC
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}

# --- OUTPUTS ---
output "cloudfront_distribution_id" {
  description = "ID de la CDN capturado por Jenkins"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "URL pública de la aplicación"
  value       = aws_cloudfront_distribution.cdn.domain_name
}