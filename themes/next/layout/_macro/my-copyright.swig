{% if page.copyright %}
<div>
	<ul class="post-copyright">
	  <li class="post-copyright-author">
		<strong>本文作者： </strong>
		<a href="/" title="访问 {{ theme.author }} 的个人博客">{{ theme.author }}</a>
	  </li>
	  <li class="post-copyright-link">
		<strong>本文链接：</strong>
		<a href="{{ url_for(page.path) }}" title="{{ page.title }}">{{ page.permalink }}</a>
	  </li>
	  <li class="post-copyright-license">
		<strong>版权声明： </strong>
		<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="noopener" target="_blank"><i class="fa fa-fw fa-creative-commons"></i>BY-NC-SA</a> 许可协议。转载请注明出处！
	  </li>
	</ul>
</div>
{% endif %}