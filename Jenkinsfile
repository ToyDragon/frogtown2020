pipeline {
    agent any

    stages {
        stage('PR Check') {
            steps {
                script {
                  if (env.CHANGE_ID) {
                      echo 'Building with PR.'
                  } else {
                      echo 'Building without PR.'
                      currentBuild.result = 'ABORTED'
                      error('Building with PR.')
                  }
                }
            }
        }
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
                sh 'echo Using port $(expr 8543 + ${BUILD_ID} % 5)'
                sh 'docker stop $(docker ps -q --filter publish=$(expr 8543 + ${BUILD_ID} % 5)) || true'
                sh 'docker run -d -l jenkins -p $(expr 8543 + ${BUILD_ID} % 5):8443 gcr.io/frogtown/frogtown2020/local:jenkins'
                script {
                    // CHANGE_ID is set only for pull requests, so it is safe to access the pullRequest global variable
                    if (env.CHANGE_ID) {
                        pullRequest.comment('Deployed [test server](https://kismarton.frogtown.me:' + (8543 + (env.BUILD_ID % 5)) + ' for change ' + env.CHANGE_ID)
                        echo 'Submitted comment with test server link.'
                    } else {
                        echo 'Cant submit comment because no pull request :(.'
                    }
                }
            }
        }
    }
    post {
        failure {
            script {
                // CHANGE_ID is set only for pull requests, so it is safe to access the pullRequest global variable
                if (env.CHANGE_ID) {
                    pullRequest.comment('[Failed build.](http://kismarton.frogtown.me:8079/job/PullRequestBuilds/job/jenkins_v2/)')
                    echo 'Submitted comment about failed build.'
                }
            }
        }
    }
}