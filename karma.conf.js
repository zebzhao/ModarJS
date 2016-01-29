module.exports = function(config){
    config.set({

        basePath : './',

        logLevel: config.LOG_DEBUG,

        files : [
            'pyscript.js',
            'src/*.spec.js'
        ],

        exclude : [
        ],

        reporters: ['progress', 'coverage'],

        preprocessors: {
        },

        autoWatch : false,

        frameworks: ['jasmine'],

        browsers : ['PhantomJS'],

        plugins : [
            'karma-jasmine',
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-coverage'
        ]
    });
};