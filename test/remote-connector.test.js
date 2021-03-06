// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var assert = require('assert');
var helper = require('./helper');

describe('RemoteConnector', function() {
  var ctx = this;

  before(function setupServer(done) {
    ctx.serverApp = helper.createRestAppAndListen();
    ctx.ServerModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.serverApp,
      datasource: helper.createMemoryDataSource()
    });
    ctx.serverApp.locals.handler.on('listening', function() { done(); });
  });

  before(function setupRemoteClient(done) {
    ctx.remoteApp = helper.createRestAppAndListen();
    ctx.RemoteModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.remoteApp,
      datasource: helper.createRemoteDataSource(ctx.serverApp)
    });
    ctx.remoteApp.locals.handler.on('listening', function() { done(); });
  });

  after(function() {
    ctx.serverApp.locals.handler.close();
    ctx.remoteApp.locals.handler.close();
    ctx.ServerModel = null;
    ctx.RemoteModel = null;
  });

  it('should support the save method', function(done) {
    var calledServerCreate = false;

    ctx.ServerModel.create = function(data, options, cb, callback) {
      if (typeof options === 'function') {
        callback = cb;
        cb = options;
        options = {};
      }

      calledServerCreate = true;
      data.id = 1;
      if (callback) callback(null, data);
      else cb(null, data);
    };

    var m = new ctx.RemoteModel({foo: 'bar'});
    m.save(function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof ctx.RemoteModel);
      assert(calledServerCreate);
      done();
    });
  });

  it('should support aliases', function(done) {
    var calledServerUpsert = false;
    ctx.ServerModel.patchOrCreate =
    ctx.ServerModel.upsert = function(id, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      calledServerUpsert = true;
      cb();
    };

    ctx.RemoteModel.updateOrCreate({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof ctx.RemoteModel);
      assert(calledServerUpsert, 'server upsert should have been called');
      done();
    });
  });
});

describe('Custom Path', function() {
  var ctx = this;

  before(function setupServer(done) {
    ctx.serverApp = helper.createRestAppAndListen();
    ctx.ServerModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.serverApp,
      datasource: helper.createMemoryDataSource(),
      options: {
        http: {path: '/custom'}
      }
    });
    ctx.serverApp.locals.handler.on('listening', function() { done(); });
  });

  before(function setupRemoteClient(done) {
    ctx.remoteApp = helper.createRestAppAndListen();
    ctx.RemoteModel = helper.createModel({
      parent: 'TestModel',
      app: ctx.remoteApp,
      datasource: helper.createRemoteDataSource(ctx.serverApp),
      options: {
        dataSource: 'remote',
        http: {path: '/custom'}
      }
    });
    ctx.remoteApp.locals.handler.on('listening', function() { done(); });
  });

  after(function(done)
  {
    ctx.serverApp.locals.handler.close();
    ctx.remoteApp.locals.handler.close();
    ctx.ServerModel = null;
    ctx.RemoteModel = null;
    done();
  });

  it('should support http.path configuration', function(done) {
    ctx.RemoteModel.create({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      done();
    });
  });
});
