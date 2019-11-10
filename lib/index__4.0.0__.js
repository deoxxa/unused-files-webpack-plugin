"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UnusedFilesWebpackPlugin = void 0;

var _classCallCheck2 = _interopRequireDefault(
  require("babel-runtime/helpers/classCallCheck")
);

var _createClass2 = _interopRequireDefault(
  require("babel-runtime/helpers/createClass")
);

var _regenerator = _interopRequireDefault(require("babel-runtime/regenerator"));

var _promise = _interopRequireDefault(require("babel-runtime/core-js/promise"));

var _asyncToGenerator2 = _interopRequireDefault(
  require("babel-runtime/helpers/asyncToGenerator")
);

var _keys = _interopRequireDefault(
  require("babel-runtime/core-js/object/keys")
);

var _toConsumableArray2 = _interopRequireDefault(
  require("babel-runtime/helpers/toConsumableArray")
);

var _extends2 = _interopRequireDefault(
  require("babel-runtime/helpers/extends")
);

var _path = _interopRequireDefault(require("path"));

var _warning = _interopRequireDefault(require("warning"));

var _globAll = _interopRequireDefault(require("glob-all"));

var _util = _interopRequireDefault(require("util.promisify"));

var applyAfterEmit = (function() {
  var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(compiler, compilation, plugin) {
      var globOptions, fileDepsMap, files, unused, errorsList;
      return _regenerator.default.wrap(
        function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.prev = 0;
                globOptions = globOptionsWith(compiler, plugin.globOptions);
                _context.next = 4;
                return _promise.default.all(plugin.promises);

              case 4:
                fileDepsMap = plugin.fileDepsMap;
                _context.next = 7;
                return globAll(
                  plugin.options.patterns || plugin.options.pattern,
                  globOptions
                );

              case 7:
                files = _context.sent;
                unused = files.filter(function(it) {
                  return !fileDepsMap[_path.default.join(globOptions.cwd, it)];
                });

                if (!(unused.length !== 0)) {
                  _context.next = 11;
                  break;
                }

                throw new Error(`
UnusedFilesWebpackPlugin found some unused files:
${unused.join(`\n`)}`);

              case 11:
                _context.next = 19;
                break;

              case 13:
                _context.prev = 13;
                _context.t0 = _context["catch"](0);

                if (!(plugin.options.failOnUnused && compilation.bail)) {
                  _context.next = 17;
                  break;
                }

                throw _context.t0;

              case 17:
                errorsList = plugin.options.failOnUnused
                  ? compilation.errors
                  : compilation.warnings;
                errorsList.push(_context.t0);

              case 19:
              case "end":
                return _context.stop();
            }
          }
        },
        _callee,
        this,
        [[0, 13]]
      );
    })
  );

  return function applyAfterEmit(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();

var globAll = (0, _util.default)(_globAll.default);

function globOptionsWith(compiler, globOptions) {
  return (0, _extends2.default)(
    {
      cwd: compiler.context
    },
    globOptions
  );
}

function getFileDepsMap(compilation) {
  var fileDepsBy = []
    .concat((0, _toConsumableArray2.default)(compilation.fileDependencies))
    .reduce(function(acc, usedFilepath) {
      acc[usedFilepath] = true;
      return acc;
    }, {});
  var assets = compilation.assets;
  (0, _keys.default)(assets).forEach(function(assetRelpath) {
    var existsAt = assets[assetRelpath].existsAt;
    fileDepsBy[existsAt] = true;
  });
  return fileDepsBy;
}

var UnusedFilesWebpackPlugin =
  /*#__PURE__*/
  (function() {
    function UnusedFilesWebpackPlugin() {
      var options =
        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      (0, _classCallCheck2.default)(this, UnusedFilesWebpackPlugin);
      (0, _warning.default)(
        !options.pattern,
        `
"options.pattern" is deprecated and will be removed in v4.0.0.
Use "options.patterns" instead, which supports array of patterns and exclude pattern.
See https://www.npmjs.com/package/glob-all#notes
`
      );
      this.options = (0, _extends2.default)({}, options, {
        patterns: options.patterns || options.pattern || [`**/*.*`],
        failOnUnused: options.failOnUnused === true
      });
      this.globOptions = (0, _extends2.default)(
        {
          ignore: `node_modules/**/*`
        },
        options.globOptions
      );
      this.promises = [];
      this.fileDepsMap = {};
    }

    (0, _createClass2.default)(UnusedFilesWebpackPlugin, [
      {
        key: "apply",
        value: function apply(compiler) {
          var _this = this;

          this.promises.push(
            new _promise.default(function(resolve) {
              compiler.plugin("after-emit", function(compilation, done) {
                _this.fileDepsMap = (0, _extends2.default)(
                  {},
                  _this.fileDepsMap,
                  getFileDepsMap(compilation)
                );
                done();
                resolve();
              });
            })
          );
          compiler.plugin("after-emit", function(compilation, done) {
            return applyAfterEmit(compiler, compilation, _this).then(
              done,
              done
            );
          });
        }
      }
    ]);
    return UnusedFilesWebpackPlugin;
  })();

exports.UnusedFilesWebpackPlugin = UnusedFilesWebpackPlugin;
var _default = UnusedFilesWebpackPlugin;
exports.default = _default;
