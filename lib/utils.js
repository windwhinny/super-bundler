var fs = require('fs'),
    path = require('path');
    async = require('async');

var utils = {
    findFile: function(filename, indexName, done) {
        fs.exists(filename, function(exists){
            if (!exists) return done(null, false);
            fs.stat(filename, function(err, stat) {
                if (err) return done(err);
                if (stat.isFile()) {
                    done(null, filename);
                } else if (stat.isDir()) {
                    utils.findFile(path.join(filename, indexName), done);
                } else {
                    done(null, false); 
                }
            })
        });
    },
    findFileInPaths: function(file, indexName, paths, done){
        var _file;

        async.some(paths, function(_path, cb) {
            var f = path.join(_path, file);

            utils.findFile(f, indexName, function(err, f){
                if (err) return cb(err);
                if (f) _file = f;
                cb(null, f);
            }); 
        }, function(err, found){
            if (err) return done(err);
            if (_file) return done(null, _file);
            done();
        })
    }
}
module.exports = utils;
