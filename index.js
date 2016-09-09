'use strict'

const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const semver = require('semver')
const gutil = require('gulp-util')
const PluginError = gutil.PluginError
const PLUGIN_NAME = require('./package.json').name

var depalert = function (directories) {
  directories = directories || ['./']
  directories = typeof directories === 'string' ? [directories] : directories

  let checkDeps = true // Standard Dependencies
  let checkDevDeps = true // Development Dependencies
  let checkOptDeps = true // Optional Dependencies
  let devcheck = []

  if (typeof directories === 'object' && !Array.isArray(directories)) {
    let cfg = directories
    directories = directories.directories || './'
    directories = typeof directories === 'string' ? [directories] : directories

    if (cfg.hasOwnProperty('ignoreProduction') && typeof cfg.ignoreProduction === 'boolean') {
      checkDeps = cfg.ignoreProduction
    }

    if (cfg.hasOwnProperty('ignoreDevelopment') && typeof cfg.ignoreDevelopment === 'boolean') {
      checkDevDeps = cfg.ignoreDevelopment
    }

    if (cfg.hasOwnProperty('ignoreOptional') && typeof cfg.ignoreOptional === 'boolean') {
      checkOptDeps = cfg.ignoreOptional
    }
  }

  if (checkDeps) {
    devcheck.push('production')
  }

  if (checkDevDeps) {
    devcheck.push('development')
  }

  if (checkOptDeps) {
    devcheck.push('optional')
  }

  if (devcheck.length === 2) {
    devcheck.splice(1, 0, 'and')
  }

  if (devcheck.length === 3) {
    devcheck.splice(2, 0, 'and')
  }

  devcheck = devcheck.join(', ').replace(/and,\s/gi, 'and ')

  gutil.log('Checking ' + devcheck + ' dependency updates in ' +
    directories.length +
    ' director' +
    (directories.length === 1 ? 'y' : 'ies'))

  directories.forEach(dir => {
    dir = path.resolve(dir)

    try {
      fs.accessSync(dir)
    } catch (e) {
      PluginError(PLUGIN_NAME + ': Cannot find/read ' + dir)
    }

    let outdatedDependencies = []
    let missing = []

    const pkg = require(path.join(dir, 'package.json'))

    if (checkDeps) {
      Object.keys(pkg.dependencies || {}).forEach(function (dependency) {
        try {
          const modulePackage = require(path.join(dir, 'node_modules', dependency, 'package.json'))
          if (semver.valid(pkg.dependencies[dependency])) {
            if (semver.lt(modulePackage.version, pkg.dependencies[dependency].replace(/[^\.|0-9]/gi, ''))) {
              outdatedDependencies.push({
                name: dependency,
                type: 'production',
                current: modulePackage.version,
                specified: pkg.dependencies[dependency]
              })
            }
          }
        } catch (e) {
          if (e.message.toLowerCase().indexOf('cannot find module') >= 0) {
            missing.push({
              name: dependency,
              specified: pkg.dependencies[dependency]
            })
          }
        }
      })
    }

    if (checkOptDeps) {
      Object.keys(pkg.optionaldependencies || {}).forEach(function (dependency) {
        try {
          const modulePackage = require(path.join(dir, 'node_modules', dependency, 'package.json'))
          if (semver.valid(pkg.optionaldependencies[dependency])) {
            if (semver.lt(modulePackage.version, pkg.optionaldependencies[dependency].replace(/[^\.|0-9]/gi, ''))) {
              outdatedDependencies.push({
                name: dependency,
                type: 'optional',
                current: modulePackage.version,
                specified: pkg.optionaldependencies[dependency]
              })
            }
          }
        } catch (e) {
          if (e.message.toLowerCase().indexOf('cannot find module') >= 0) {
            missing.push({
              name: dependency,
              specified: pkg.optionaldependencies[dependency]
            })
          }
        }
      })
    }

    if (checkDevDeps) {
      Object.keys(pkg.devdependencies || {}).forEach(function (dependency) {
        try {
          const modulePackage = require(path.join(dir, 'node_modules', dependency, 'package.json'))
          if (semver.valid(pkg.devdependencies[dependency])) {
            if (semver.lt(modulePackage.version, pkg.devdependencies[dependency].replace(/[^\.|0-9]/gi, ''))) {
              outdatedDependencies.push({
                name: dependency,
                type: 'development',
                current: modulePackage.version,
                specified: pkg.devdependencies[dependency]
              })
            }
          }
        } catch (e) {
          if (e.message.toLowerCase().indexOf('cannot find module') >= 0) {
            missing.push({
              name: dependency,
              specified: pkg.devdependencies[dependency]
            })
          }
        }
      })
    }

    gutil.log('Checking dependencies in', dir)
    if (outdatedDependencies.length > 0 || missing.length > 0) {
      gutil.log('  ' + chalk.bold.yellow('UPDATES REQUIRED:'.toUpperCase()))
      gutil.log('')
    }

    if (outdatedDependencies.length > 0) {
      gutil.log('  ' + chalk.underline('The following dependencies need to be updated:'))
      gutil.log('  ')
      outdatedDependencies.forEach(function (dependency, i) {
        gutil.log(
          '   ' +
          ((i + 1) < 10 ? ' ' : '') + (i + 1) + ')' + ' ' +
          chalk.bold(dependency.name) + ' from ' + chalk.bold.cyan(dependency.current) +
          ' to ' + chalk.bold.magenta(dependency.specified)
        )
      })
    }

    if (missing.length > 0) {
      gutil.log('    ' + chalk.underline('The following dependencies need to be added:'))
      gutil.log('  ')
      missing.forEach(function (dependency, i) {
        gutil.log(
          '   ' +
          ((i + 1) < 10 ? ' ' : '') + (i + 1) + ')' + ' ' +
          chalk.bold(dependency.name) + ' v' + chalk.bold.magenta(dependency.specified)
        )
      })
    }

    console.log('\n')

    // if (outdatedDependencies.length > 0 || missing.length > 0) {
    //   gutil.log('  ' + chalk.bold.yellow('Run the following: ') + chalk.bold.white.bgBlack('npm install') + '\n')
    // }
  })
}

module.exports = depalert
