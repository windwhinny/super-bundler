var uglify = require('uglify-js');

function htmlAndCss (code){
    if (typeof code != 'string') return code;
    return code.replace(/\n\s*/g,'').replace(/\s+/g,' ');
};

module.exports = {
    css: htmlAndCss, 
    html: htmlAndCss,
    js: function(code){
        return uglify.minify(code, {fromString: true}).code;
    }
}
