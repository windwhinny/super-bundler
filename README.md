#super bundler

super-bundler 可以将多个文件，如  css, js, template 打包入 HTML 中。
相比其它前端模块化工具，它配置更加简单，且有很强的扩展性，尤其适合 SPA 这类不需要动态渲染 HTML 的 web 应用。

##Example

index.js
```
var logger = require('./logger');
logger.log();
```

logger.js
```
module.exports = {
    log: function(){
        console.log('hello world');
    }
};
```

index.less
```
@blue: #246AFF;
h1{
    color: @blue;
}
```

index.html
```
<!doctype html>
<html>
    <head>
    <bundle src="index.less" type="less"/>
    <bundle src="index.js" type="js"/>
    </head>
    <body>
        <h1>Super Pack</h1> 
    </body>
</html>
```

example.js
```
var Bundle = require('super-bundle'),
    fs = require('fs');

var options = {};

var bundle = new Bundle(options);

fs.readFile('./index.html', function(err,content){
    if(err) return console.error(err);
    
    bundle.exec('./index.html', content.toString(), function(err, content){
    
    if(err)return console.error(err);
    console.log(content);
         
    })
})
```

```
$ node example.js
```

output
```
<!doctype html>
<html>
    <head>
    <style type="text/css">h1 {
  color: #246AFF;
}
</style>
    <script type="text/javascript" id="$$$require">
;(function(global){var ms=[];function r(i){return ms[i]};r.ms=ms;global.$$$require=r;})("undefined"==typeof module?window:global);
</script><script type="text/javascript" id="./logger">
;(function(){var m={exports: {}};(function(require, module, exports){
module.exports = {
    log:function(){
        console.log('hello world');
    }
}


})($$$require,m,m.exports);$$$require.ms.push(m.exports||{});})();
</script><script type="text/javascript" id="index.js">
;(function(){var m={exports: {}};(function(require, module, exports){
var logger = require(0);
logger.log();


})($$$require,m,m.exports);$$$require.ms.push(m.exports||{});})();
</script>
    </head>
    <body>
        <h1>Super Pack</h1> 
    </body>
</html>

```

如果你设置了`options.uglify = true`，那么输出的结果将会全部被 uglify

```
<!doctype html><html><head><style type="text/css">h1 {color: #246AFF;}</style>style><script type="text/javascript" id="$$$require">
!function(n){function e(n){return o[n]}var o=[];e.ms=o,n.$$$require=e}("undefined"==typeof module?window:global);
</script>script><script type="text/javascript" id="./logger">
!function(){var o={exports:{}};!function(o,e,r){e.exports={log:function(){console.log("hello world")}}}($$$require,o,o.exports),$$$require.ms.push(o.exports||{})}();
</script>script><script type="text/javascript" id="index.js">
!function(){var r={exports:{}};!function(r,e,o){var $=r(0);$.log()}($$$require,r,r.exports),$$$require.ms.push(r.exports||{})}();
</script>script></head>head><body><h1>Super Pack</h1>h1> </body>body></html>html>
```

##options

- uglify 是否 uglify
- expandAll 展开所有的 bundle, (`link="true"` 的标签默认不会被展开)
- paths 寻找文件的路径
