require('../includes/generators/leetcode')(hexo);

// Debug helper
hexo.extend.helper.register('console', function () {
    console.log(arguments)
});