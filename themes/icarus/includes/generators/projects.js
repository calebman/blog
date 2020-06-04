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
        hexo.extend.generator.register('projects', function (locals) {
            return {
                path: 'projects/',
                layout: ['projects'],
                data: Object.assign({}, {
                    widgets: [
                        { type: 'profile', position: 'left' },
                        { type: 'recent_posts', position: 'left' }
                    ],
                    projects: Object.values(projectObj),
                    sliceProjects: sliceArray(Object.values(projectObj), 2)
                })
            };
        });

        // watch file and render it
        const handleFileChange = (name) => {
            if (!/\.md$/.test(name)) {
                return
            }
            const path = `${projectPath}/${name}`
            const post = frontMatterParse(fs.readFileSync(path));
            hexo.render.render({ text: post._content, engine: 'md' }).then(result => {
                projectObj[path] = Object.assign({}, post, {
                    _content: result
                });
            });
        };

        const watcher = chokidar.watch('', {
            depth: 1,
            cwd: projectPath
        }).on('add', handleFileChange)
            .on('change', handleFileChange)
            .on('unlink', name => delete projectObj[name]);
        if (!process.argv[2].startsWith('s')) {
            hexo.on('exit', () => watcher.close())
        }
    }
}
function sliceArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i = i + size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}