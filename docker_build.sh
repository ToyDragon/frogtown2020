if [ -z "$1" ]
then
  echo "Missing argument"
  exit 1
fi

echo "Building beta version..."
cp "config.beta.json" "config.json" || cp "~/frogtown/config/config.beta.json" "config.json";
docker build -t gcr.io/frogtown/frogtown2020/beta:$1 .
docker push gcr.io/frogtown/frogtown2020/beta:$1

echo "Building prod version..."
cp "config.prod.json" "config.json" || cp "~/frogtown/config/config.prod.json" "config.json";
docker build -t gcr.io/frogtown/frogtown2020/prod:$1 .
docker push gcr.io/frogtown/frogtown2020/prod:$1

echo "Building local version..."
cp "config.local.json" "config.json" || cp "~/frogtown/config/config.local.json" "config.json";
docker build -t gcr.io/frogtown/frogtown2020/local:$1 .

echo "Done building and restored local config."
