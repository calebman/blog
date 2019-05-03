pipeline {
  agent any
  stages {
    stage('config node') {
      steps {
        nodejs 'Jenkins_Nodejs'
      }
    }
    stage('build pages') {
      steps {
        sh '''node -v
npm -v
npm i hexo -g
npm i
hexo clean
hexo generate
'''
      }
    }
  }
}