output "api_url" {
  value = google_cloud_run_service.api.status[0].url
}

output "database_ip" {
  value = google_sql_database_instance.postgres.public_ip_address
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "bigquery_dataset" {
  value = google_bigquery_dataset.warehouse.dataset_id
}

output "storage_bucket_media" {
  value = google_storage_bucket.media.name
}

output "storage_bucket_models" {
  value = google_storage_bucket.models.name
}