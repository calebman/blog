const cheerio = require('cheerio');
module.exports = function (hexo) {
    function patchCodeHighlight(content) {
        const $ = cheerio.load(content, { decodeEntities: false });
        const headlines = $('h1, h2, h3, h4, h5, h6');
        headlines.each(function () {
            const title = $(this).attr('id');
            const first =$(this).children().first();
            $(this).empty();
            $(this).append(first);
            $(this).append(`<span>${title}</span>`);
        });
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