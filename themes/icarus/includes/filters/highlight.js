const cheerio = require('cheerio');
const attributesStr = ['autocomplete="off"','autocorrect="off"','autocapitalize="off"','spellcheck="false"','contenteditable="true"'].join(' ')
module.exports = function (hexo) {
    function patchCodeHighlight(content) {
        const $ = cheerio.load(content, { decodeEntities: false });
        $('figure.highlight').addClass('hljs');
        $('figure.highlight .code .line span').each(function () {
            const classes = $(this).attr('class').split(' ');
            if (classes.length === 1) {
                $(this).addClass('hljs-' + classes[0]);
                $(this).removeClass(classes[0]);
            }
        });
        $('figure.highlight').each(function () {
            const figureClasses = $(this).attr('class') ? $(this).attr('class').split(' ') : [];
            const lanuage = figureClasses.length > 1 ? figureClasses[1] : 'NONE';
            $(this).wrap(`<div class="highlight-wrap" ${attributesStr} data-rel="${lanuage.toUpperCase()}"></div>`);
        })
        return $.html();
    }
    
    /**
     * Add .hljs class name to the code blocks and code elements
     */
    hexo.extend.filter.register('after_post_render', function (data) {
        data.content = data.content ? patchCodeHighlight(data.content) : data.content;
        data.excerpt = data.excerpt ? patchCodeHighlight(data.excerpt) : data.excerpt;
        return data;
    });
}