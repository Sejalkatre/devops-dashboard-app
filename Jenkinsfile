pipeline {

```
agent any

environment {

    IMAGE_NAME = "sejalkatre/devops-dashboard"

    DOCKER_CREDS = "dockerhub-creds"
    GITHUB_CREDS = "github-creds"

    SONAR_SERVER = "SonarQube"

    GITOPS_REPO = "https://github.com/YOUR_USERNAME/devops-dashboard-gitops.git"

    SLACK_CHANNEL = "#devops-alerts"
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

            withSonarQubeEnv("${SONAR_SERVER}") {

                sh '''
                sonar-scanner \
                -Dsonar.projectKey=devops-dashboard \
                -Dsonar.projectName=devops-dashboard \
                -Dsonar.sources=.
                '''
            }
        }
    }

    stage('Quality Gate') {

        steps {

            timeout(time: 10, unit: 'MINUTES') {

                waitForQualityGate abortPipeline: true

            }
        }
    }

    stage('Generate Next Version') {

        steps {

            script {

                latestTag = sh(
                    script: """
                    curl -s https://hub.docker.com/v2/repositories/sejalkatre/devops-dashboard/tags?page_size=100 |
                    jq -r '.results[].name' |
                    grep '^v' |
                    sort -V |
                    tail -1
                    """,
                    returnStdout: true
                ).trim()

                if (!latestTag) {
                    latestTag = "v0"
                }

                versionNumber = latestTag.replace("v","").toInteger()

                versionNumber++

                env.NEW_TAG = "v${versionNumber}"

                echo "New Version = ${env.NEW_TAG}"
            }
        }
    }

    stage('Build Docker Image') {

        steps {

            sh """
            docker build \
            -t ${IMAGE_NAME}:${NEW_TAG} .
            """
        }
    }

    stage('Docker Login') {

        steps {

            withCredentials([
                usernamePassword(
                    credentialsId: "${DOCKER_CREDS}",
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

            sh """
            docker push ${IMAGE_NAME}:${NEW_TAG}
            """
        }
    }

    stage('Update GitOps Repository') {

        steps {

            withCredentials([
                usernamePassword(
                    credentialsId: "${GITHUB_CREDS}",
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_PASS'
                )
            ]) {

                sh '''

                rm -rf gitops

                git clone https://$GIT_USER:$GIT_PASS@github.com/YOUR_USERNAME/devops-dashboard-gitops.git gitops

                cd gitops

                sed -i "s#image: .*#image: sejalkatre/devops-dashboard:'"${NEW_TAG}"'#g" deployment.yaml

                git config user.name "Jenkins"

                git config user.email "jenkins@local"

                git add .

                git commit -m "Updated image to ${NEW_TAG}" || true

                git push origin main

                '''
            }
        }
    }

}

post {

    success {

        slackSend(
            channel: "${SLACK_CHANNEL}",
            color: "good",
            message: """
            SUCCESS

            Job: ${JOB_NAME}
            Build: ${BUILD_NUMBER}
            Image: ${NEW_TAG}

            Deployment triggered through ArgoCD.
            """
        )
    }

    failure {

        slackSend(
            channel: "${SLACK_CHANNEL}",
            color: "danger",
            message: """
            FAILED

            Job: ${JOB_NAME}
            Build: ${BUILD_NUMBER}

            Check Jenkins console logs.
            """
        )
    }

    always {

        cleanWs()

    }
}
```

}
