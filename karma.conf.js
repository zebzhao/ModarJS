module.exports = function(config){
    config.set({

        basePath : './',

        logLevel: config.LOG_DEBUG,

        files : [
            'pyscript.debug.js',
            {pattern: '**/*.spec.js', watched: false, included: true, served: true}
        ],

        exclude : [
        ],

        reporters: ['progress', 'coverage'],

        preprocessors: {
            'pyscript.debug.js': ['coverage']
        },

        autoWatch : false,

        frameworks: ['jasmine'],

        browsers : ['PhantomJS'],

        plugins : [
            'karma-jasmine',
            'karma-phantomjs-launcher',
            'karma-coverage'
        ]
    });
};