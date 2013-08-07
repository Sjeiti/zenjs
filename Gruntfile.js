module.exports = function (grunt) {
	'use strict';

	var fs = require('fs'),
		sPackage = 'package.json',
		oPackage = grunt.file.readJSON(sPackage),
		sEmmetPath = 'C:\\xampp\\htdocs\\libs\\js\\emmet\\javascript\\',

		sZen = fs.readFileSync('src/zen.js').toString(),
		sBanner = sZen.match(/\/\*\*([\s\S]*?)\*\//g)[0],
		sVersion = sBanner.match(/(\s\*\s@version\s)(\d+\.\d+\.\d+)/).pop()
	;
	if (oPackage.version!==sVersion) {
		grunt.log.writeln('Updated package version from',oPackage.version,'to',sVersion);
		oPackage.version = sVersion;
		fs.writeFile(sPackage,JSON.stringify(oPackage,null,'\t'));
	}

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
			zen: {
				src: [
					'wrap/before.js.tpl',
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
					sEmmetPath+'filters\\html.js',
					'src/zen.js',
					'wrap/after.js.tpl'
				],
				dest: 'dist/zen.js'
			}
		},

		uglify: {
			zen: {
				options: { banner: sBanner+'\n' },
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