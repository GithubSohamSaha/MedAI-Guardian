terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  backend "gcs" {
    bucket = "medai-guardian-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ============ VPC ============
resource "google_compute_network" "vpc" {
  name                    = "medai-guardian-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "medai-guardian-subnet"
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
}

# ============ Cloud SQL ============
resource "google_sql_database_instance" "postgres" {
  name             = "medai-guardian-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-f1-micro"
    disk_size         = 20
    disk_type         = "PD_SSD"
    disk_autoresize   = true
    activation_policy = "ALWAYS"
    
    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc.id
      
      authorized_networks {
        name  = "cloud-run"
        value = "0.0.0.0/0"
      }
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "main" {
  name     = "medai_db"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app_user" {
  name     = "medai_app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# ============ Cloud Run ============
resource "google_cloud_run_service" "api" {
  name     = "medai-api"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/medai-api:latest"
        
        env {
          name  = "DATABASE_URL"
          value = "postgresql+psycopg://${google_sql_user.app_user.name}:${var.db_password}@${google_sql_database_instance.postgres.public_ip_address}/${google_sql_database.main.name}"
        }
        
        env {
          name  = "SECRET_KEY"
          value = var.secret_key
        }
        
        env {
          name  = "GOOGLE_API_KEY"
          value = var.google_api_key
        }

        env {
          name  = "REDIS_URL"
          value = "redis://${google_redis_instance.cache.host}:6379"
        }

        env {
          name  = "FIREBASE_PROJECT_ID"
          value = var.firebase_project_id
        }

        env {
          name  = "FIREBASE_PRIVATE_KEY"
          value = var.firebase_private_key
        }

        env {
          name  = "FIREBASE_CLIENT_EMAIL"
          value = var.firebase_client_email
        }

        resources {
          limits = {
            memory = "1Gi"
            cpu    = "1"
          }
        }

        startup_probe {
          http_get {
            path = "/health"
            port = 8000
          }
          failure_threshold     = 10
          initial_delay_seconds = 30
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/cpu-throttling" = "true"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "api_policy" {
  location    = google_cloud_run_service.api.location
  project     = google_cloud_run_service.api.project
  service     = google_cloud_run_service.api.name

  policy_data = data.google_iam_policy.noauth.policy_data
}

# ============ Redis Memorystore ============
resource "google_redis_instance" "cache" {
  name           = "medai-cache"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  authorized_network = google_compute_network.vpc.id
  redis_version  = "REDIS_7_0"
}

# ============ Cloud Storage ============
resource "google_storage_bucket" "media" {
  name          = "${var.project_id}-media"
  location      = var.region
  force_destroy = true
  
  uniform_bucket_level_access = true
  
  public_access_prevention = "enforced"
}

resource "google_storage_bucket" "models" {
  name          = "${var.project_id}-models"
  location      = var.region
  force_destroy = true
  
  uniform_bucket_level_access = true
}

# ============ BigQuery ============
resource "google_bigquery_dataset" "warehouse" {
  dataset_id                  = "medai_warehouse"
  friendly_name              = "MedAI Guardian Data Warehouse"
  description                = "Analytics data for PHC operations"
  location                   = var.region
  default_table_expiration_ms = 31536000000  # 1 year
  
  access {
    role          = "roles/bigquery.dataViewer"
    special_group = "projectViewers"
  }
}

# ============ Cloud Scheduler ============
resource "google_cloud_scheduler_job" "daily_forecast" {
  name        = "daily-forecast-job"
  description = "Run daily stock and patient forecasts"
  schedule    = "0 6 * * *"
  time_zone   = "Asia/Kolkata"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.api.status[0].url}/api/v1/internal/daily-forecast"
    
    headers = {
      "Content-Type" = "application/json"
    }
  }
}