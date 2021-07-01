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
                sh 'docker run -d gcr.io/frogtown/frogtown2020/local:jenkins'
            }
        }
        stage('Destroy') {
            steps {
                echo 'destroy.'
            }
        }
    }
}