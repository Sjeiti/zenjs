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
					console.log('start test'); // log
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
					console.log('end test'); // log
				}
			}
		},

		testUsage: {
			options: {},
			emmet: {
				src: './temp/emmet.js',
				dest: './temp/emmet.min.js',
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
		}
	});


	grunt.registerMultiTask('testUsage', '', function() {
		var oOptions = this.options({
					disable: true
					,mark: 'UNUSED'
					,uglify: true
					,uglifyOptions: null // see: https://github.com/mishoo/UglifyJS2#compressor-options
					,replace: true
				})
			,i
			,iLineNr
			,sLine
			,sFile// = fs.readFileSync(oData.src).toString()
			,aLines// = sFile.split(/[\n]/g)
			,iLines// = aLines.length
			,sMark = (oOptions.disable?('return false;'):'')+(oOptions.mark!==''?'/*'+oOptions.mark+'*/':'')
			,rFunctionG = /function\s?(\w*)?\(([^\)]+)?\)\s?{/g
			,aFnLines = []
			,iFnLines
			,sAppend// = oData.append||''
			,sNewFile
			// sniff injection vars
			,sInsertName = 'sniff_'+Math.ceil(1E8*Math.random()).toString(36)
			,oCountPrints = {}
			,iUnused
			,aUnused = []
			,aUsed = []
			// dummy replacement vars
			,sLargeDummy = 'z'+Math.ceil(1E32*Math.random()).toString(36)
			,iDummyLength = 1
			,iDummyIndex = 0
			,sDummyName
			// uglify vars
			,bUglify = oOptions.uglify
			,uglify
			,oCompressor
			,oAst
		;
		//
		function getInsert(nr){
			return ';'+sInsertName+'('+nr+');';
		}
		GLOBAL[sInsertName] = function(line){
			oCountPrints[line]++;
		};
		//
		// Iterate over all src-dest file pairs.
		this.files.forEach(function(f) {
			sFile = fs.readFileSync(f.src).toString();
			sAppend = f.append||'';
			aLines = sFile.split(/[\n]/g);
			iLines = aLines.length;
			//
			// inject sniffer function into target script
			for (i=0;i<iLines;i++) {
				iLineNr = i+1;
				sLine = aLines[i];
				if (sLine.match(rFunctionG)) {
					aFnLines.push(iLineNr);
					aLines[i] = sLine = sLine.replace(rFunctionG,'$&'+getInsert(iLineNr));
				}
			}
			iFnLines = aFnLines.length;
			sNewFile = aLines.join('\n')+sAppend;
			fs.writeFileSync(f.dest,sNewFile);
			//
			// count unused functions
			f.prepare&&f.prepare();
			for (i=0;i<iLines;i++) oCountPrints[aFnLines[i]] = 0;
			require(f.dest);
			f.test&&f.test();
			//
			// gather result data
			for (i=0;i<iFnLines;i++) {
				iLineNr = aFnLines[i];
				if (oCountPrints[iLineNr]===0) {
					aUnused.push(iLineNr);
				} else {
					aUsed.push(iLineNr);
				}
			}
			iUnused = aUnused.length;
			//
			// remove sniff() and disable unused functions
			for (i=0;i<iFnLines;i++) {
				iLineNr = aFnLines[i];
				sLine = aLines[iLineNr-1];
				var bUsed = aUsed.indexOf(iLineNr)>=0
					,sInsert = getInsert(iLineNr)
				;
				aLines[iLineNr-1] = sLine.replace(sInsert,bUsed?'':sMark);
			}
			sNewFile = aLines.join('\n');
			//
			// let uglify compress it
			if (bUglify) {
				uglify = require('uglify-js');
				oCompressor = uglify.Compressor(oOptions.uglifyOptions||{warnings:false});
				oAst = uglify.parse(sNewFile);
				oAst.figure_out_scope();
				oAst = oAst.transform(oCompressor);
				oAst.figure_out_scope();
				oAst.compute_char_frequency();
				oAst.mangle_names();
				sNewFile = oAst.print_to_string({});//options
				//
				// replace unused function expressions with dummy, alter unused function declarations
				if (oOptions.replace) {
					// find smallest possible dummy name
					while (iDummyIndex>=0) {
						iDummyLength++;
						iDummyIndex = sNewFile.indexOf(sLargeDummy.substr(0,iDummyLength));
					}
					sDummyName = sLargeDummy.substr(0,iDummyLength);
					// replace unused function expressions with dummy
					sNewFile = 'function '+sDummyName+'(){return!1};'+sNewFile.replace(/function\([^)]*\){return!1}/g,sDummyName);
					// remove unused function declaration arguments and contents
					sNewFile = sNewFile.replace(/(function\s\w+\()([^)]*)(\){)(return!1)(})/g,'$1$3$5');
				}
			}
			//
			// save result
			fs.writeFileSync(f.dest,sNewFile);
			//
			// result log
			grunt.log.writeln('tested',f.src,'with',iLines,'lines');
			if (iUnused===0) {
				grunt.log.ok('no redundant functions found');
			} else {
				grunt.log.error(iUnused+' of '+iFnLines+' functions unused');
			}
		});
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-unused-functions');

	// tasks (jshint)
	grunt.registerTask('default',[
		,'concat:zen'
		,'uglify:zen'
		,'uglify:jqueryzen'
	]);

	grunt.registerTask('unused',[
		'concat:emmet'
		,'unused_functions'
	]);

	grunt.registerTask('usage',[
		'concat:emmet'
		,'testUsage'
	]);

	grunt.registerTask('prod',[
		'concat:emmet'
		,'testUsage'
		,'jshint'
		,'concat:zen'
		,'uglify:zen'
		,'uglify:zengz'
		,'uglify:jqueryzen'
		,'uglify:jqueryzengz'
	]);
};