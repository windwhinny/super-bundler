var less = require('less'),
    uglify = require('./uglify'),
    fs = require('fs');

function LessBundleParser(options){
    this.paths = options.paths || [];
    this.uglify = options.uglify || false;
    this.expandAll = options.expandAll || false;
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

            done(null, '<style type="text/css">' + data + '</style>');
        });

    })
};

LessBundleParser.type = 'less';

module.exports = LessBundleParser;
