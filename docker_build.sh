if [ -z "$1" ]
then
  echo "Missing argument"
  exit 1
fi

echo "Copying in secrets..."
cp -r "/home/jenkins/frogtown/secrets" .;

if [ "$2" != "local" ]
then
  echo "Building beta version..."
  cp "config.beta.json" "config.json" || cp "/home/jenkins/frogtown/config/config.beta.json" "config.json";
  docker build -t gcr.io/frogtown/frogtown2020/beta:$1 .
  docker push gcr.io/frogtown/frogtown2020/beta:$1

  echo "Building prod version..."
  cp "config.prod.json" "config.json" || cp "/home/jenkins/frogtown/config/config.prod.json" "config.json";
  docker build -t gcr.io/frogtown/frogtown2020/prod:$1 .
  docker push gcr.io/frogtown/frogtown2020/prod:$1
fi

if [ "$2" != "betaprod" ]
then
  echo "Building local version..."
  cp "config.local.json" "config.json" || cp "/home/jenkins/frogtown/config/config.local.json" "config.json";
  docker build -t gcr.io/frogtown/frogtown2020/local:$1 .
fi

echo "Done building and restored local config."
