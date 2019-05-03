pipeline {
  agent any
  stages {
    stage('build pages') {
      steps {
        nodejs('node11.14.0') {
          sh '''echo $PATH
node -v
npm -v
npm i hexo -g
npm i
hexo clean
hexo g'''
        }

      }
    }
  }
}