var less = require('less'),
    uglify = require('./uglify'),
    autoprefixer = require('autoprefixer'),
    postcss = require('postcss'),
    fs = require('fs');

function LessBundleParser(options){
    this.paths = options.paths || [];
    this.uglify = options.uglify || false;
    this.expandAll = options.expandAll || false;
    this.cssPro = postcss([ autoprefixer ]);
}

LessBundleParser.prototype.expand = function(attrs, done){
    var self = this;

    fs.readFile(attrs.filename, function(err, data) {
        if (err) return done(err);

        less.render(data.toString(), {
            paths: self.paths 
        }, function(err, data) {
            if (err) return done(err);

            if (self.uglify) {
                data = uglify.css(data.css); 
            } else {
                data = data.css;
            };
            
            self.cssPro.process(data)
                .then(function(result){
                    result.warnings().forEach(function (warn) {
                        console.warn(warn.toString());
                    });

                    done(null, '<style type="text/css">' + result.css + '</style>');
                }, function(err){
                    done(err);
                })
        });

    })
};

LessBundleParser.type = 'less';

module.exports = LessBundleParser;
