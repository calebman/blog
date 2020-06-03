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
            const config = this.config;
            const perPage = config.category_generator.per_page;
            const questions = Object.values(leetcodeObj);
            return pagination('leetcode/', questions, {
                perPage: perPage,
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
        const handleFileChange = (path) => {
            const post = frontMatterParse(fs.readFileSync(path));
            hexo.render.render({ text: post._content, engine: 'md' }).then(result => {
                leetcodeObj[path] = Object.assign({}, post, {
                    _content: result
                });
            });
        };
        const watcher = chokidar.watch(leetcodePath, {
            depth: 1
        }).on('add', handleFileChange)
            .on('change', handleFileChange)
            .on('unlink', path => delete leetcodeObj[path]);
        hexo.on('exit', () => watcher.close());
    }
}