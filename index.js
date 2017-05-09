const fs = require('fs');
const path = require('path');
const less = require('less');

function LessThemeWebpackPlugin(options) {
  if (!options.sourceFile) throw new Error('[LessThemeWebpackPlugin] No source file provided.');
  if (!options.themePath) throw new Error('[LessThemeWebpackPlugin] No theme directory provided.');
  if (!options.sourceChunk) throw new Error('[LessThemeWebpackPlugin] No source chunk provided.');

  this.options = options;
}

LessThemeWebpackPlugin.prototype.apply = function(compiler) {
  const options = this.options;
  const pathToThemes = path.resolve(process.cwd(), options.themePath);

  if (!fs.existsSync(pathToThemes)) throw new Error('[LessThemeWebpackPlugin] Path to themes is invalid.');

  compiler.plugin('after-compile', function(c, callback) {
    const availableThemes = fs.readdirSync(pathToThemes)
    .filter(function(p) { return p.endsWith('.less'); })
    .filter(function(p) { return p !== 'base.less'; })
    .filter(function(p) {
      return !fs.lstatSync(path.resolve(pathToThemes, p)).isDirectory();
    });

    const addedThemeFiles = Object.keys(c.assets)
      .filter(function(k) {
        return k == options.sourceFile; 
      })
      .map(function(asset) {
        const source = c.assets[asset].source().replace(/["']\{\{(.+?)\}\}["']/gim, "$1");

        return availableThemes.map(function(theme) {
          const themeData = fs.readFileSync(path.resolve(pathToThemes, theme));
          const fullFile = themeData + '\n' + source;

          return less.render(fullFile, { compress: true, strictMath: true })
            .then(css => css.css)
            .then(css => [theme, css]);
        });
      })
      .reduce(function(acc, arr) {
        return acc.concat(arr);
      }, []);

    return Promise.all(addedThemeFiles).then(function(themes) {
      const newFilePath = path.dirname(options.sourceFile);
      themes.forEach(function(theme) {
        const newFileName = theme[0].slice(0, theme[0].lastIndexOf('.')) + '.css';
        const newThemePath = path.join(newFilePath, newFileName);

       c.assets[newThemePath] = {
         source: function() { return new Buffer(theme[1]); },
         size: function() { return Buffer.byteLength(theme[1]); }
       }
      });

      // remove base theme
      delete c.assets[options.sourceFile];
      for (const chunk of c.chunks) {
        if (chunk.name === options.sourceChunk) {
          chunk.files = chunk.files.filter(function(f) {
            return f !== options.sourceFile;
          });
        }
      }

      callback();
      return themes;
    });
  });
};

module.exports = LessThemeWebpackPlugin;
