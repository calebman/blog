const fs = require('hexo-fs');
const path = require('path');
const chokidar = require('chokidar');
const frontMatterParse = require('hexo-front-matter');
const pagination = require('hexo-pagination');
const leetcodePath = path.join(process.cwd(), 'source/_leetcode');
/**
 * Leetcode list page generator
 */
module.exports = function (hexo) {
    if (fs.existsSync(leetcodePath)) {
        const leetcodeObj = {}
        hexo.extend.generator.register('leetcode', function (locals) {
            const questions = Object.values(leetcodeObj);
            return pagination('leetcode/', questions, {
                perPage: 1,
                layout: ['leetcode', 'index'],
                format: 'page/%d/',
                data: Object.assign({}, {
                    widgets: [
                        { type: 'profile', position: 'left' },
                        { type: 'recent_posts', position: 'left' }
                    ]
                })
            });
        });

        // watch file and render it
        const handleFileChange = (name) => {
            if(!/\.md$/.test(name)) {
                return
            }
            const path = `${leetcodePath}/${name}`
            const post = frontMatterParse(fs.readFileSync(path));
            hexo.render.render({ text: post._content, engine: 'md' }).then(result => {
                leetcodeObj[path] = Object.assign({}, post, {
                    _content: result
                });
            });
        };
        const watcher = chokidar.watch('', {
            depth: 1,
            cwd: leetcodePath
        }).on('add', handleFileChange)
            .on('change', handleFileChange)
            .on('unlink', name => delete leetcodeObj[name]);
        if(!process.argv[2].startsWith('s')) {
            watcher.close();
        }
    }
}