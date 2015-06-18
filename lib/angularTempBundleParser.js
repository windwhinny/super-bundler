var fs = require('fs'),
    uglify = require('./uglify'),
    async = require('async'),
    path = require('path');

function NGBundleParser (options){
    this.paths = options.paths || [];
    this.uglify = options.uglify || false;
    this.expandAll = options.expandAll || false;
}

NGBundleParser.prototype.type = function(file, done){
    fs.stat(file, function(err, state){
        if (err) return done(err);
        if (state.isDirectory()){
            done(null, 'dir');
        } else {
            done(null, 'file');
        }
    })
}

NGBundleParser.prototype.handleFile = function(root, data, file, done){
    var ext = path.extname(file);
    if (ext != '.html') {
        return done(null, data);
    }

    fs.readFile(file, function(err, content){
        if (err) return done(err);

        data += '<script type="text/ng-template" id="'+file.replace(root+'/','')+'">'+
            content.toString()+
            "</script>";
        done(null, uglify.html(data));
    });
}

NGBundleParser.prototype.handleDir = function(root, data, dir, done){
    var self = this;
    fs.readdir(dir, function(err, files){
        if (err) return cb(err);

        async.reduce(files, data, function(data, subFile, cb){
            if (subFile == '.' || subFile == '..') {
                return cb(null, data); 
            }

            self.readFile(root, data, path.join(dir, subFile), cb);
        }, done);
    }); 
}

NGBundleParser.prototype.readFile = function(root, data, file, done){
    this.type(file, function(err, type) {
        if(err) return done(err);

        if (type == 'file') {
            this.handleFile(root, data, file, done);
        } else {
            this.handleDir(root, data, file, done);
        };
    }.bind(this));
}

NGBundleParser.prototype.expand = function(attrs, done){
    var data = "";
    var root = path.dirname(attrs.filename);

    this.readFile(root, '', attrs.filename, done);
}

NGBundleParser.type = 'ng-temp';

module.exports = NGBundleParser;
