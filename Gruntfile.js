module.exports = function (grunt) {
	'use strict';

	var fs = require('fs'),
		sPackage = 'package.json',
		oPackage = grunt.file.readJSON(sPackage),
		sEmmetPath = './emmet/javascript/',
//		sEmmetPath = 'C:\\xampp\\htdocs\\libs\\js\\emmet\\javascript\\',
//		sEmmetPath = 'C:\\xampp\\htdocs\\libs\\js\\zen\\emmet\\javascript\\',

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
				dest: 'temp/emmet.js'
			},
			zen: {
				src: [
					'wrap/before.js.tpl',
					'temp/emmet.min.js',
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
				//options: { banner: bannerTinysort+'\n' },
				src: 'src/jquery.zen.js',
				dest: 'dist/jquery.zen.min.js'
			},
			jqueryzengz: {
				src: 'src/jquery.zen.js',
				dest: 'dist/jquery.zen.jgz',
				compress: true
			}
		},

		unused_functions: {
			options: {},
			emmet: {
				src: 'temp/emmet.js',
				dest: 'temp/emmet.min.js',
				append: '\n;GLOBAL.emmet=emmet;',
				prepare: function(){},
				test: function(){
					[
						'ul>li*3>a*2',
						'div>ul>li',
						'div+p+bq',
						'div+div>p>span+em',
						'div+div>p>span+em^bq',
						'div+div>p>span+em^^^bq',
						'ul>li*5',
						'div>(header>ul>li*2>a)+footer>p',
						'(div>dl>(dt+dd)*3)+footer>p',
						'div#header+div.page+div#footer.class1.class2.class3',
						'td[title="Hello world!" colspan=3]',
						'ul>li.item$*5',
						'ul>li.item$$$*5',
						'ul>li.item$@-*5',
						'ul>li.item$@3*5',
						'ul>li.item$@-3*5',
						'a{Click me}',
						'p>{Click }+a{here}+{ to continue}'
					].forEach(function(abbr){
						emmet.expandAbbreviation(abbr);
					});
				}
			}
		},

		copy: {
			external: {
				files: [
					{
						expand: true,
						flatten: true,
						src: '../opensource/web/scripts/jquery.opensource.min.js',
						dest: 'libs/'
					},
					{
						expand: true,
						cwd: '../opensource/web/style/',
						src: ['*.!(less|php|*.php)','*/**'],
						dest: 'style/'
					}
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-unused-functions');

	// tasks (jshint)
	grunt.registerTask('default',[
		,'concat:zen'
		,'uglify:zen'
		,'uglify:jqueryzen'
	]);

	grunt.registerTask('usage',[
		'concat:emmet'
		,'unused_functions'
	]);

	grunt.registerTask('prod',[
		'concat:emmet'
		,'unused_functions'
		,'jshint'
		,'concat:zen'
		,'uglify:zen'
		,'uglify:zengz'
		,'uglify:jqueryzen'
		,'uglify:jqueryzengz'
	]);

	grunt.registerTask('external',[
		'copy:external'
	]);
};