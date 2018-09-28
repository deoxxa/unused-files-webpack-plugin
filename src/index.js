import path from "path";
import warning from "warning";
import nativeGlobAll from "glob-all";
import promisify from "util.promisify";

const globAll = promisify(nativeGlobAll);

function globOptionsWith(compiler, globOptions) {
  return {
    cwd: compiler.context,
    ...globOptions
  };
}

function getFileDepsMap(compilation) {
  const fileDepsBy = [...compilation.fileDependencies].reduce(
    (acc, usedFilepath) => {
      acc[usedFilepath] = true;
      return acc;
    },
    {}
  );

  const { assets } = compilation;
  Object.keys(assets).forEach(assetRelpath => {
    const existsAt = assets[assetRelpath].existsAt;
    fileDepsBy[existsAt] = true;
  });
  return fileDepsBy;
}

async function applyAfterEmit(compiler, compilation, plugin) {
  try {
    const globOptions = globOptionsWith(compiler, plugin.globOptions);

    await Promise.all(plugin.promises);

    const fileDepsMap = plugin.fileDepsMap;

    const files = await globAll(
      plugin.options.patterns || plugin.options.pattern,
      globOptions
    );
    const unused = files.filter(
      it => !fileDepsMap[path.join(globOptions.cwd, it)]
    );

    if (unused.length !== 0) {
      throw new Error(`
UnusedFilesWebpackPlugin found some unused files:
${unused.join(`\n`)}`);
    }
  } catch (error) {
    if (plugin.options.failOnUnused && compilation.bail) {
      throw error;
    }
    const errorsList = plugin.options.failOnUnused
      ? compilation.errors
      : compilation.warnings;
    errorsList.push(error);
  }
}

export class UnusedFilesWebpackPlugin {
  constructor(options = {}) {
    warning(
      !options.pattern,
      `
"options.pattern" is deprecated and will be removed in v4.0.0.
Use "options.patterns" instead, which supports array of patterns and exclude pattern.
See https://www.npmjs.com/package/glob-all#notes
`
    );
    this.options = {
      ...options,
      patterns: options.patterns || options.pattern || [`**/*.*`],
      failOnUnused: options.failOnUnused === true
    };

    this.globOptions = {
      ignore: `node_modules/**/*`,
      ...options.globOptions
    };

    this.promises = [];
    this.fileDepsMap = {};
  }

  apply(compiler) {
    this.promises.push(
      new Promise(resolve => {
        compiler.plugin("after-emit", (compilation, done) => {
          this.fileDepsMap = {
            ...this.fileDepsMap,
            ...getFileDepsMap(compilation)
          };
          done();
          resolve();
        });
      })
    );

    compiler.plugin("after-emit", (compilation, done) =>
      applyAfterEmit(compiler, compilation, this).then(done, done)
    );
  }
}

export default UnusedFilesWebpackPlugin;
