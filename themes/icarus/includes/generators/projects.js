const fs = require('hexo-fs');
const path = require('path');
const chokidar = require('chokidar');
const frontMatterParse = require('hexo-front-matter');
const projectPath = path.join(process.cwd(), 'source/_projects');
/**
 * Leetcode list page generator
 */
module.exports = function (hexo) {
    if (fs.existsSync(projectPath)) {
        const projectObj = {}
        const handleFileChange = (path) => {
            const post = frontMatterParse(fs.readFileSync(path));
            hexo.render.render({ text: post._content, engine: 'md' }).then(result => {
                projectObj[path] = Object.assign({}, post, {
                    _content: result
                });
            });
        };
        const handleFileRemove = path => {
            delete projectObj[path]
        }
        function sliceArray(arr, size) {
            var arr2 = [];
            for (var i = 0; i < arr.length; i = i + size) {
                arr2.push(arr.slice(i, i + size));
            }
            return arr2;
        }
        hexo.extend.generator.register('projects', function (locals) {
            return {
                path: 'projects/',
                layout: ['projects'],
                data: Object.assign({}, locals, {
                    widgets: [],
                    projects: Object.values(projectObj),
                    sliceProjects: sliceArray(Object.values(projectObj), 3)
                })
            };
        });
        chokidar.watch(projectPath, {
            depth: 1
        }).on('add', handleFileChange)
        .on('change', handleFileChange)
        .on('unlink', handleFileRemove);
    }
}