const fs = require('hexo-fs');
const path = require('path');
const chokidar = require('chokidar');
const frontMatterParse = require('hexo-front-matter');
const leetcodePath = path.join(process.cwd(), 'source/_leetcode');
/**
 * Leetcode list page generator
 */
module.exports = function (hexo) {
    if (fs.existsSync(leetcodePath)) {
        const leetcodeObj = {}
        hexo.extend.generator.register('leetcode-post', function (locals) {
            const questions = Object.values(leetcodeObj);
            return questions.map(o => Object.assign({}, {
                path: o.path,
                layout: ['leetcode_post'],
                data: Object.assign({}, o)
            }))
        });

        hexo.extend.generator.register('leetcode-page', function (locals) {
            const questions = Object.values(leetcodeObj)
            const groups = loadGroups(questions)
            return {
                path: 'leetcode/index.html',
                layout: ['leetcode'],
                data: Object.assign({}, {
                    groups: groups
                })
            }
        });

        // watch file and render it
        const handleFileChange = (name) => {
            if (!/\.md$/.test(name)) {
                return
            }
            const path = `${leetcodePath}/${name}`
            const post = frontMatterParse(fs.readFileSync(path));
            hexo.render.render({ text: post._content, engine: 'md' }).then(result => {
                leetcodeObj[path] = Object.assign({}, post, {
                    path: `leetcode/posts/${name.substring(0, name.lastIndexOf('.md'))}/index.html`,
                    _content: result
                });
            });
        };


        if (process.argv[2].startsWith('s')) {
            chokidar.watch('', {
                depth: 1,
                cwd: leetcodePath
            }).on('add', handleFileChange)
                .on('change', handleFileChange)
                .on('unlink', name => delete leetcodeObj[name]);
        } else {
            fs.readdirSync(leetcodePath).forEach(handleFileChange);
        }
    }
}

const loadGroups = questions => {
    const groups = {}
    questions.forEach(o => {
        const groupName = o.group || '其他'
        groups[groupName] = groups[groupName] || []
        groups[groupName].push(o)
    })
    return Object.keys(groups).map(k => {
        return {
            name: k,
            posts: groups[k]
        }
    })
}