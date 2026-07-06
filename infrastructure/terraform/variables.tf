variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "google_api_key" {
  description = "Google API key for Gemini and Vision"
  type        = string
  sensitive   = true
}

variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
  sensitive   = true
}

variable "firebase_private_key" {
  description = "Firebase private key"
  type        = string
  sensitive   = true
}

variable "firebase_client_email" {
  description = "Firebase client email"
  type        = string
  sensitive   = true
}