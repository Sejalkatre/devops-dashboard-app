pipeline {
    agent any

    environment {
        IMAGE_NAME = "sejalkatre/devops-dashboard"
        GITOPS_REPO = "https://github.com/Sejalkatre/devops-dashboard-gitops.git"
        MAJOR_VERSION = "v0"
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
                    /opt/sonar-scanner/bin/sonar-scanner \
                      -Dsonar.projectKey=devops-dashboard \
                      -Dsonar.projectName=devops-dashboard \
                      -Dsonar.sources=. \
                      -Dsonar.sourceEncoding=UTF-8 \
                      -Dsonar.host.url=http://localhost:9000
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
                        }
                    }
                }
            }
        }

        stage('Check Source Changes') {
            steps {
                script {
                    def changedFiles = sh(
                        script: "git diff --name-only HEAD~1 HEAD || true",
                        returnStdout: true
                    ).trim()

                    echo "Changed Files: ${changedFiles}"

                    if (changedFiles.contains("src/") ||
                        changedFiles.contains("Dockerfile") ||
                        changedFiles.contains("package.json")) {
                        env.SOURCE_CHANGED = "true"
                    } else {
                        env.SOURCE_CHANGED = "false"
                    }

                    echo "SOURCE_CHANGED = ${env.SOURCE_CHANGED}"
                }
            }
        }

        stage('Generate Version') {
            when {
                expression { env.SOURCE_CHANGED == "true" }
            }

            steps {
                script {

                    // Git commit short SHA
                    def commit = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()

                    // Build number
                    def buildNum = env.BUILD_NUMBER

                    // FINAL VERSION
                    env.NEW_TAG = "${MAJOR_VERSION}-${buildNum}-${commit}"

                    echo "Generated Version = ${env.NEW_TAG}"
                }
            }
        }

        stage('Build Docker Image') {
            when {
                expression { env.SOURCE_CHANGED == "true" }
            }

            steps {
                sh "docker build -t ${IMAGE_NAME}:${env.NEW_TAG} ."
            }
        }

        stage('Docker Login') {
            when {
                expression { env.SOURCE_CHANGED == "true" }
            }

            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            when {
                expression { env.SOURCE_CHANGED == "true" }
            }

            steps {
                sh "docker push ${IMAGE_NAME}:${env.NEW_TAG}"
            }
        }

        stage('Update GitOps Repo') {
            when {
                expression { env.SOURCE_CHANGED == "true" }
            }

            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_PASS'
                )]) {

                    sh """
                        rm -rf gitops
                        git clone https://${GIT_USER}:${GIT_PASS}@github.com/Sejalkatre/devops-dashboard-gitops.git gitops
                        cd gitops

                        sed -i "s#image: .*#image: ${IMAGE_NAME}:${NEW_TAG}#g" environments/dev/deployment.yaml

                        git config user.name "Jenkins"
                        git config user.email "jenkins@local"

                        git add environments/dev/deployment.yaml
                        git commit -m "Update image to ${NEW_TAG}" || true
                        git push origin main
                    """
                }
            }
        }
    }

   post {

    success {
        echo "✅ Pipeline Successful"
        echo "Docker Image: ${IMAGE_NAME}:${env.NEW_TAG}"

        mail(
            to: 'sejalkatre021@gmail.com',
            subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            body: """
Pipeline Status : SUCCESS

Job Name     : ${env.JOB_NAME}
Build Number : ${env.BUILD_NUMBER}
Docker Image : ${IMAGE_NAME}:${env.NEW_TAG}

GitOps repository updated successfully.

Build URL:
${env.BUILD_URL}
"""
        )
    }

    failure {
        echo "❌ Pipeline Failed"

        mail(
            to: 'sejalkatre021@gmail.com',
            subject: "FAILURE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            body: """
Pipeline Status : FAILURE

Job Name     : ${env.JOB_NAME}
Build Number : ${env.BUILD_NUMBER}

Please check the Jenkins console logs.

Build URL:
${env.BUILD_URL}
"""
        )
    }

    always {
        cleanWs()
    }
}
}
