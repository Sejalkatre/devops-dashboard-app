pipeline {
    agent any

    environment {
        IMAGE_NAME = "sejalkatre/devops-dashboard"
        GITOPS_REPO = "https://github.com/Sejalkatre/devops-dashboard-gitops.git"
    }

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    SonarScanner \
                    -Dsonar.projectKey=devops-dashboard \
                    -Dsonar.projectName=devops-dashboard \
                    -Dsonar.sources=. \
                    -Dsonar.sourceEncoding=UTF-8
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error "❌ Quality Gate Failed: ${qg.status}"
                        } else {
                            echo "✅ Quality Gate Passed"
                        }
                    }
                }
            }
        }

        stage('Generate Version') {
            steps {
                script {

                    def latestTag = sh(
                        script: '''
                        curl -s https://hub.docker.com/v2/repositories/sejalkatre/devops-dashboard/tags?page_size=100 |
                        jq -r ".results[].name" |
                        grep "^v" |
                        sort -V |
                        tail -1
                        ''',
                        returnStdout: true
                    ).trim()

                    if (!latestTag) {
                        latestTag = "v0"
                    }

                    def versionNumber = latestTag.replace("v","").toInteger()
                    versionNumber++

                    env.NEW_TAG = "v${versionNumber}"

                    echo "New Image Tag = ${env.NEW_TAG}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${env.NEW_TAG} ."
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh "docker push ${IMAGE_NAME}:${env.NEW_TAG}"
            }
        }

        stage('Update GitOps Repo') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'github-creds',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_PASS'
                    )
                ]) {

                    sh """
                    rm -rf gitops

                    git clone https://${GIT_USER}:${GIT_PASS}@github.com/Sejalkatre/devops-dashboard-gitops.git gitops

                    cd gitops

                    sed -i 's#image: .*#image: ${IMAGE_NAME}:${env.NEW_TAG}#g' deployment.yaml

                    git config user.name "Jenkins"
                    git config user.email "jenkins@local"

                    git add .
                    git commit -m "Updated image to ${env.NEW_TAG}" || true
                    git push origin main
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline Successful"
            echo "Image Tag = ${env.NEW_TAG}"
        }

        failure {
            echo "Pipeline Failed"
        }

        always {
            cleanWs()
        }
    }
}
