sudo gcloud container clusters get-credentials frogtown-prod-a --region=us-central1-c
sudo kubectl rollout restart deployments