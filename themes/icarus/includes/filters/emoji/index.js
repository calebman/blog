'use strict'

const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const cheerio = require('cheerio')
module.exports = function (hexo) {
  var options = _.assign({
    enable: true,
    inject: true,
    version: 'latest',
    className: 'github-emoji',
  }, hexo.config.githubEmojis)
  
  if (options.enable !== false) {
    const emojis = _.assign(
      {},
      require('./emojis.json')
    )
  
    fs.writeFile(
      path.join(__dirname, 'emojis.json'),
      JSON.stringify(emojis, null, '  '),
      function (err) { err && console.warn(err) },
    )
  
    hexo.extend.filter.register('after_post_render', data => {  
      if (options.inject) {
        cheerio.load(data.content, {decodeEntities: false})('body').append(`<script>
          document.querySelectorAll('.${options.className}')
            .forEach(el => {
              if (!el.dataset.src) { return; }
              const img = document.createElement('img');
              img.style = 'display:none !important;';
              img.src = el.dataset.src;
              img.addEventListener('error', () => {
                img.remove();
                el.style.color = 'inherit';
                el.style.backgroundImage = 'none';
                el.style.background = 'none';
              });
              img.addEventListener('load', () => {
                img.remove();
              });
              document.body.appendChild(img);
            });
        </script>`)
      }

      if (data['no-emoji']) { 
        return data 
      }
  
      data.content = data.content ? patchEmojis(data.content, emojis) : data.content;
      data.excerpt = data.excerpt ? patchEmojis(data.excerpt, emojis) : data.excerpt;
      return data;
    })
  
    hexo.extend.helper.register('github_emoji', name => renderEmoji(emojis, name))
    hexo.extend.tag.register('github_emoji', args => renderEmoji(emojis, args[0]))
  }

  function patchEmojis(content, emojis) {
    return content.replace(
      /:(\w+):/ig,
      (match, p1) => emojis[p1] ? renderEmoji(emojis, p1) : match,
    )
  }
  
  function renderEmoji (emojis, name) {
    if (!emojis[name]) { return name }
  
    const styles = _.isObject(options.styles)
      ? Object.keys(options.styles)
        .filter(k => _.isString(options.styles[k]))
        .map(k => k + ':' + options.styles[k])
      : []
  
    if (options.inject) {
      styles.push(
        `background:no-repeat url(${emojis[name].src}) center/contain`,
      )
    } else {
      styles.push(`background-image:url(${emojis[name].src})`)
    }
  
    const codepoints = emojis[name].codepoints
      ? emojis[name].codepoints.map(c => `&#x${c};`).join('')
      : ' '
  
    return `<span class="${options.className}" style="${styles.join(';')}" data-src="${emojis[name].src}">${codepoints}</span>`
  }
}