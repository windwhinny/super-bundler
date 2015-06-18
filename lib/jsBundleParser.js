var uglify = require('./uglify'),
    CMDRequireParser = require('./CMDRequireParser'),
    fs = require('fs'),
    async = require('async');

const TAG_TMP = '<script type="text/javascript">$code</script>';

function JSBundleParser(options){
    this.paths = options.paths || [];
    this.uglify = options.uglify || false;
    this.expandAll = options.expandAll || false;
}

JSBundleParser.prototype.expand = function(attrs, done){
    if (attrs.link) {
        if (this.expandAll) {
            this.findFile(attrs, done);
        } else {
            return done(null, '<script type="text/javascript" src="'+attrs.src+'"></script>');
        }
    } else {
        return this._expand(attrs, done); 
    }   
};

JSBundleParser.prototype.findFile = function(attrs, done){
    var self = this;
    var file;

    function gotFileData(err, data){
        if (err) return done(err);

        data = data.toString();
        if (self.uglify) {
            try{
                data = uglify.js(data) 
            } catch(e) {
                return done(e); 
            }
        };

        data = '<script type="text/javascript">\n'+data+'\n</script>';
        done(null, data);
    };

    async.some(this.paths, function(path, cb){
        var _file = path + '/' + attrs.src.toString();
        _file = _file.replace(/\/\//g, '/');
        fs.exists(_file, function(exists){
            if (exists) file = _file;
            cb(null, exists); 
        });
    }, function(exists){ 
        if (file) {
            return fs.readFile(file, gotFileData);
        };

        done(new Error('file not found: '+ srcName));
    });
};

JSBundleParser.prototype._expand = function(attrs, done){
    var self = this;
    var data = "";

    CMDRequireParser(attrs.filename, attrs.src,{
        paths: this.paths 
    })
    .on('data', function(module){
        var code = module.code;
        if (self.uglify) {
            code = uglify.js(code);
        }

        data += '<script type="text/javascript" id="'+ module.name +'">\n' + code + '\n</script>';
    })
    .on('error', function(err){
        console.log('err', err)
        done(err);
    })
    .on('end', function(){
        done(null, data); 
    });
};

JSBundleParser.type = 'js';

module.exports = JSBundleParser;
