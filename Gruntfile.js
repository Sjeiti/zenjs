module.exports = function (grunt) {
	'use strict';

	var sPackage = 'package.json',
		oPackage = grunt.file.readJSON(sPackage),
		sEmmetPath = 'C:\\xampp\\htdocs\\libs\\js\\emmet\\javascript\\'
	;

	grunt.initConfig({
		pkg: oPackage,

		jshint: {
			options: { jshintrc: '.jshintrc' },
			files: [
				'src/zen.js',
				'src/jquery.zen.js'
			]
		},

		concat: {
			options: {
				separator: ';'
			},
			emmet: {
				src: [
					sEmmetPath+'underscore.js',
					sEmmetPath+'core.js',
					sEmmetPath+'parsers\\abbreviationParser.js',
					sEmmetPath+'utils.js',
					sEmmetPath+'handlerList.js',
					sEmmetPath+'stringStream.js',
					sEmmetPath+'resources.js',
					sEmmetPath+'profile.js',
					sEmmetPath+'abbreviationUtils.js',
					sEmmetPath+'htmlMatcher.js',
					sEmmetPath+'tabStops.js',
					sEmmetPath+'preferences.js',
					sEmmetPath+'elements.js',
					sEmmetPath+'filters.js',
					sEmmetPath+'filters\\format.js',
					sEmmetPath+'filters\\html.js'
				],
				dest: 'dist/emmet.js'
			},
			zen: {
				src: [
					'dist/emmet.js',
					'src/zen.js'
				],
				dest: 'dist/zen.js'
			}
		},

		uglify: {
			zen: {
//				options: { banner: bannerTinysort+'\n' },
				src: 'dist/zen.js',
				dest: 'dist/zen.min.js'
			},
			zengz: {
				src: 'dist/zen.js',
				dest: 'dist/zen.jgz',
				compress: true
			},
			jqueryzen: {
//				options: { banner: bannerTinysort+'\n' },
				src: 'src/jquery.zen.js',
				dest: 'dist/jquery.zen.min.js'
			},
			jqueryzengz: {
				src: 'src/jquery.zen.js',
				dest: 'dist/jquery.zen.jgz',
				compress: true
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('default',[
		/*'jshint'
		,*/'concat'
//		,'distill'
		,'uglify'
	]);
};