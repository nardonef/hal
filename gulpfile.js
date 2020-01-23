/* eslint-disable no-console */
const {series, src} = require('gulp');
const shell = require('gulp-shell');
const eslint = require('gulp-eslint');

const folders = {
    source: 'src/',
    tests: 'tests/',
    build: 'data/build/',
    package: 'data/build/nodejs',
    temp_dir: 'data/tmp/',
};

const lint = () => {
    return src([folders.source + '**/*.js', folders.tests + '**/*.js']).
        pipe(eslint()).
        pipe(eslint.format()).
        pipe(eslint.failAfterError());
};

const fix = () => {
    return src([folders.source + '**/*.js', folders.tests + '**/*.js']).
        pipe(eslint({
            fix: true,
        }));
};

const test = shell.task(
    // eslint-disable-next-line max-len
    [`nyc mocha --file ${folders.tests}bootstrap.js --recursive ${folders.tests}`],
    {
        errorMessage: 'The tests did not pass or you do not ' +
            'have enough code coverage',
    },
);

exports.test = test;
exports.lint = lint;
exports.fix = fix;

exports.default = series(fix, lint, test);
