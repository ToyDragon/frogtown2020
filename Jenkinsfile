def body = ''
def comment
pipeline {
    agent any

    stages {
        stage('PR Check') {
            steps {
                script {
                  // CHANGE_ID is set only for pull requests, so it is safe to access the pullRequest global variable
                  if (env.CHANGE_ID) {
                      echo 'Building with PR.'
                      body='Build started. [Details](http://kismarton.frogtown.me:8079/job/PullRequestBuilds/view/change-requests/job/PR-' + env.CHANGE_ID + '/)'
                      comment=pullRequest.comment(body)
                  } else {
                      echo 'Aborting, can\'t build without a PR.'
                      currentBuild.result = 'ABORTED'
                      error('Building without PR.')
                  }
                }
            }
        }
        stage('Build') {
            steps {
                sh 'npm install && npm run-script build && ./docker_build.sh jenkins_${CHANGE_ID}_${BUILD_ID} local'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
                sh 'npx eslint src'
            }
        }
        stage('Deploy') {
            steps {
                script {
                    body += '\nCleaning up old container.'
                    pullRequest.editComment(comment.id, body)
                }
                sh '''
                  PORT=$(expr 8543 + ${BUILD_ID} % 5);
                  echo Using port $PORT;
                  CONTAINERID=$(docker ps -q --filter publish=$PORT);
                  echo Found existing container: $CONTAINERID;
                  [ -z "$CONTAINERID" ] || docker stop $(docker ps -q --filter publish=$PORT);
                  BANNER="<a href='https://github.com/ToyDragon/frogtown2020/pull/$CHANGE_ID'>PR $CHANGE_ID VERSION $BUILD_ID</a>"
                  echo "Banner string: $BANNER"
                  docker run -d -l jenkins -p $PORT:8443 -e FROGTOWN_DEBUG_BANNER="$BANNER" gcr.io/frogtown/frogtown2020/local:jenkins_${CHANGE_ID}_${BUILD_ID};
                '''
                script {
                    body += '\nDeployed [test server](https://kismarton.frogtown.me:' + (8543 + ((env.BUILD_ID as Integer) % 5)) + ') for change ' + env.CHANGE_ID + '/' + env.BUILD_ID
                    pullRequest.editComment(comment.id, body)
                    echo 'Submitted comment with test server link.'
                }
            }
        }
        stage('Build Beta/Prod Images') {
            steps {
                script {
                    if (pullRequest.body.contains('[BETAPROD]')) {
                      body += '\nBuilding beta/prod images.'
                      pullRequest.editComment(comment.id, body)

                      sh './docker_build.sh jenkins_${CHANGE_ID}_${BUILD_ID} betaprod'
                      
                      body += '\nBuilt and uploaded images for beta and prod.'
                      pullRequest.editComment(comment.id, body)
                    } else {
                      body += '\nSkipping beta/prod images. Include "[BETAPROD]" in the pull request body to have them built.'
                      pullRequest.editComment(comment.id, body)
                    }
                }
            }
        }
    }
    post {
        failure {
            script {
                body += '\n\n[Failed build.](http://kismarton.frogtown.me:8079/job/PullRequestBuilds/view/change-requests/job/PR-' + env.CHANGE_ID + '/)';
                pullRequest.editComment(comment.id, body)
                echo 'Submitted comment about failed build.'
            }
        }
    }
}