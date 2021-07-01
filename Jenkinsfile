pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm install && npm run-script build && ./docker_build.sh jenkins local'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'docker stop $(docker ps -q --filter ancestor=gcr.io/frogtown/frogtown2020/local:jenkins) || true'
                sh 'docker run -d -p 8543:8443 gcr.io/frogtown/frogtown2020/local:jenkins'
            }
        }
        stage('Destroy') {
            steps {
                sh 'container=$(docker ps -q --filter ancestor=gcr.io/frogtown/frogtown2020/local:jenkins); sleep 180; echo "Stopping container $container"; docker stop $container'
            }
        }
    }
}