var path = require('path'),
    async = require('async'),
    uglify = require('./uglify'),
    fs = require('fs');

function Bundle(options) {
    options = options || {};
    this.uglify = options.uglify || false;
    this.options = options;
    this.paths = options.paths || [__dirname];
    this.init();
}

Bundle.prototype.init = function(){
    var self = this;
    ['angularTempBundleParser',
    'jsBundleParser',
    'lessBundleParser',
    ]
    .forEach(function(file){
       var plugin = require('./'+file);
       self.loadPlugin(plugin);
    });
}

Bundle.prototype.exec = function(filename, data, done) {
    if (this.uglify) {
        data = uglify.html(data);
    };

    var matches = data.match(/<bundle\s+.*?src=('.*?'|".*?").*?>.*?<\s*?\/\s*?bundle\s*?>/g);

    if (!matches) {
        return done(null, data);
    }

    this.injectFiles(filename, matches, data, done);
};

Bundle.prototype.getAttrs = function(tag){
    var matches = tag.match(/[^\s]+?=(".*?"|'.*?')/g);
    var bundle = {};

    matches.forEach(function(str){
        str = str.split('=') 
        var name = str[0];
        var value = str[1];
        bundle[name] = value.replace(/(^['"]|['"]$)/g, "").trim();
    });

    return bundle;
}

Bundle.prototype.injectFiles = function(filename, bundleMatches, data, done) {
    var self = this;

    async.map(bundleMatches, function(tag, cb) {

        var attrs = self.getAttrs(tag);

        attrs.filename = path.normalize(path.dirname(filename)+'/'+attrs.src);

        self.expandFile(attrs, function(err, data){
            if (err || !data) return cb(err);
            cb(null, {
                data: data,
                tag: tag
            });
        });

    }, function(err, bundles) {
        if (err) return done(err);
        self.sendBundles(data, bundles.filter(Boolean), done);    
    })
};

Bundle.prototype.sendBundles = function(data, bundles, done) {
    try{
        var out = bundles.reduce(function(out, bundle){
            var index = data.indexOf(bundle.tag);
            if ( index >= 0 ) {
                out.push(data.slice(0, index));
                out.push(bundle.data);
                data = data.slice(index);
                data = data.replace(bundle.tag,'');
            }
            return out;
        }, []);

        out.push(data);

    }catch(e){return done(e)}

    done(null, out.join(''));
};

Bundle.prototype.loadPlugin = function(plugin){
    this.plugins = this.plugins || {};

    this.plugins[plugin.type]  = new plugin(this.options);
}

Bundle.prototype.expandFile = function(attrs, done){
    var parser = this.plugins[attrs.type];
    if (!parser) return done(null, '');

    parser.expand(attrs, done);
};

module.exports = Bundle;
