sudo gcloud container clusters get-credentials website-1 --region=us-central1-c
sudo kubectl rollout restart deployments  