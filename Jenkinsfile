pipeline {
  agent any
  stages {
    stage('build pages') {
      steps {
        nodejs('Jenkins_Nodejs') {
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
}