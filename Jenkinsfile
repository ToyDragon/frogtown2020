pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm install && npm run-script build && ./docker_build.sh ${BUILD_TAG} local'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}