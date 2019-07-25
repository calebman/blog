pipeline {
  agent any
  stages {
    stage('build pages') {
      steps {
        nodejs('node11.14.0') {
          sh '''echo $PATH
                node -v
                npm -v
                npm i
                hexo -v
                hexo clean
                hexo g'''
        }
      }
    }
    stage('deploy pages') {
      steps {
        sshPublisher(publishers: [sshPublisherDesc(configName: 'aliyunServer', transfers: [sshTransfer(cleanRemote: false, excludes: '', execCommand: '', execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: 'blog/', remoteDirectorySDF: false, removePrefix: 'public/', sourceFiles: 'public/**')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false)])
      }
    }
  }
}