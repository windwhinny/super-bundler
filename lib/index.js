var gutil = require('gulp-util'),
    PluginError = gutil.PluginError,
    through = require('through2'),
    path = require('path'),
    fs = require('fs'),
    Bundle = require('./bundleParser');

Bundle.middleware = function(options) {
    var bundle = new Bundle(options);

    return function(req, res, next) {

        if (req.method != 'GET') {
            return next(); 
        }

      //  if (_path.match(/\.[^\/]+$/)){
      //      return next();
      //  } if (_path.match(/.html$/)) {
      //      _path = this.root + _path;
      //  } else if (_path.match(/\/$/)){
      //      _path = this.root + _path + 'index.html'
      //  } else {
      //      _path = this.root + _path + '/index.html'
      //  };

        function gotFileContent(err, content) {
            if (err) return next(err);

            content = content.toString();

            bundle.exec(_path, content, function(err, content){
                if (err) return next(err);

                if (!res.headersSent) {
                    res.set('Content-Type', 'text/html');
                };

                res.send(content);
            });
        };


        var _path = path.normalize(options.index);

        fs.exists(_path, function(exists){
            if (!exists) return next();

            fs.stat(_path, function(err, state){
                if (err) return next(err);

                if (!state.isFile()){
                    return next(); 
                }

                fs.readFile(_path, gotFileContent);
            })
        });
    }
}

Bundle.gulp = function(options) {
    var bundle = new Bundle(options);

    function transform(fileObj, enc, cb){
        var self = this;
        bundle.exec(fileObj.path,
            fileObj._contents.toString(),
            function(err, data){
                if (err) return self.emit('error', new PluginError('bundler', err)); 
                fileObj.contents = new Buffer(data);
                cb(null, fileObj);
            });
    };

    return through.obj(transform);
}

module.exports = Bundle;
