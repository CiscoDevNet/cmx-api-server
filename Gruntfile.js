module.exports = function(grunt) {

    //
    // Project configuration.
    //
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        src: {
            jsfiles: ["bin/cmxApiService", "config/**/*.js", "lib/**/*.js", "routes/**/*.js", "views/**/*.js", "main.js"]
        },
        jshint: {
            options: {
                curly: false,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: false,
                boss: true,
                eqnull: true,
                browser: true,
                evil: true,
                globals: {
                    jQuery: true,
                    Holder: true,
                    _: true,
                    console: true,
                    validate: true
                }
            },
            all: ['Gruntfile.js', '<%=src.jsfiles%>']
        },
        clean: {
            src: ["target", "dist"]
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: './', src: ['./bin/**', './cert_install/**', './config/*', './lib/*', './routes/**', './views/**'], dest: 'dist/'},
                    {src: ['Gruntfile.js'], dest: 'dist/'},
                    {src: ['main.js'], dest: 'dist/'},
                    {src: ['package.json'], dest: 'dist/'},
                    {src: ['README.md'], dest: 'dist/'},
                    ]
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'target/cisco-cmx-api-server-<%=pkg.version%>.zip',
                    mode: 'zip'
                },
                files: [
                    {expand: true, cwd: 'dist/', src: ['**'], dest: '.'}
                    ]
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    //
    // default task
    //
    grunt.registerTask('default', ['jshint', 'clean', 'copy', 'compress']);
};
