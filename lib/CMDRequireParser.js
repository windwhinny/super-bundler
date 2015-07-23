var utils = require('./utils'),
    path = require('path'),
    fs = require('fs'),
    through = require('through2');

const REQUIRE_REG = new RegExp("require\\s*\\(\\s*('[^'\\)]*?'|\"[^\"\\)]*?\")\\s*\\)", 'g');

module.exports = function(filename, name, options){
    var paths = options.paths || [];
    var stream = through();
    options.stream = stream;

    var task = new Task(options);

    process.nextTick(function(){
        task.getRequires(filename, name, 0); 
    })
    
    return stream;
}

function Task (options){
    this.options = options || {};
    this.paths = this.options.paths || [];
    this.loaded = [];
    this.stack = [];
    this.stream = this.options.stream;
}

Task.prototype.error = function(err) {
    if (err) return this.stream.emit('error', err);
}

/**
 * 检查是否有循环依赖
 */
Task.prototype.detectCircular = function(filename){
    var index = this.stack.indexOf(filename);

    if (index >=0 ) {
        var stack = this.stack.splice(index);
        stack.push(filename);

        var err = stack.reduce(function(str, file){
            str += file+' -> \n';
            return str;
        },'circular dependencies:\n')

        err = new Error(err);
        this.error(err);
        return true;
    };

    return false;
};

Task.prototype.getRequires = function(filename, name, deeps){
    if(this.detectCircular(filename)) return;

    this.stack.push(filename);

    var done = function(){};
    var self = this;
    if (typeof deeps == 'function') {
        done = deeps;
        deeps = null;
    };

    if (deeps === 0) {
        try{
            self.stream.emit('data',{
                code: ';(function(global){var ms=[];function r(i){return ms[i]};r.ms=ms;global.$$$require=r;})("undefined"==typeof module?window:global);',
                name: '$$$require'
            });
        } catch(e) {
            if (err) return self.error(e);
        }
    };

    self._getRequires(filename, function(err, reqs){
        if (err) return self.error(err);
        self.transformReq(reqs, path.dirname(filename), function(err, reqs){
            if (err) return self.error(err);
            self.readReqs(reqs, function(err) {
                if (err) return self.error(err);

                self.getContent(filename, function(err, content){
                    if (err) return self.error(err);

                    self.record(filename, reqs);

                    content = self.replaceReq(content, reqs);
                    
                    try{
                        self.stream.emit('data',{
                            filename: filename,
                            code: content,
                            name: name
                        });
                    }catch(e){
                        return self.error(e);
                    }

                    if (deeps === 0) {
                        self.stream.emit('end');
                    };
                    done();
                })
            })
        });
    });
};

Task.prototype.record = function(filename, reqs){
    var self = this;
    var loaded = reqs.map(function(req){
        return req.filename;
    });

    loaded.push(filename);

    loaded.forEach(function(file){
        if (self.loaded.indexOf(file) < 0) {
            self.loaded.push(file); 
        } 
    })
};

Task.prototype._getRequires = function(filename, done){
    var self = this;
    self.getContent(filename, function(err, content){
        if (err) return done(err);

        var matches = content.match(REQUIRE_REG);

        if (!matches) return done(null, []);

        done(null,matches.map(function(match){
            return {
                name: match.replace(/^require\s*\(['"]/, '').replace(/['"]\s*\)/, '').trim(),
                match: match
            };
        }))
    });
}

Task.prototype.transformReq = function(reqs, ref, done){
    var self = this;
    async.map(reqs, function(req, cb) {
        var name = req.name;

        function next(err, filename){
            if (err) return cb(err);
            req.filename = filename;
            cb(null, req);
        };

        if (name.lastIndexOf('.js') != name.length - 3  ) {
            name = name + '.js';
        };

        if (name.indexOf('.') == 0)  {
            var file = path.join(ref, name);
            utils.findFile(file, 'index.js', next);
        } else {
            utils.findFileInPaths(name, 'index.js', self.paths, next); 
        }
    }, function(err, reqs){
        if(err) return done(err);
        var ok = reqs.every(function(req){
            if (!req.filename){
                done(new Error(req.name+' not found in paths ' + self.paths.join(", ")))
                return false; 
            } 
            return true;
        });
        reqs.forEach(function(req){
            if (self.loaded.indexOf(req.filename) >=0){
                req.skip = true; 
            };
        });
        
        ok && done(null, reqs);
    });
}

Task.prototype.getContent = function(filename, done) {
    fs.readFile(filename, function(err, content){
        if (err) return done(err);
        done(null, content.toString());
    });
}

Task.prototype.replaceReq = function(content, reqs){
    var self = this;
    reqs.forEach(function(req){
        var index = self.loaded.indexOf(req.filename);
        content = content.split(req.match).join('require(' + index + ')');  
    });

    return ';(function(){var m={exports: {}};(function(require, module, exports){\n'+
        content+
        '\n})($$$require,m,m.exports);$$$require.ms.push(m.exports||{});})();'
};

Task.prototype.readReqs = function(reqs, done) {
    var self = this;
    async.eachSeries(reqs, function(req, cb){
        if (req.skip) return cb();
        self.getRequires(req.filename, req.name, cb);
    }, function(){
        self.stack.pop();
        done(); 
    }); 
};

