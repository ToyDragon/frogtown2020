echo "Building beta version..."
cp "config.beta.json" "config.json"
sudo docker build -t gcr.io/frogtown/frogtown2020/beta .
sudo docker push gcr.io/frogtown/frogtown2020/beta

echo "Building prod version..."
cp "config.prod.json" "config.json"
sudo docker build -t gcr.io/frogtown/frogtown2020/prod .
sudo docker push gcr.io/frogtown/frogtown2020/prod

cp "config.local.json" "config.json"
echo "Done building and restored local config."
