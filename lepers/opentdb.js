function initAjax(err, window) {
	if (err) {
        console.error(err);
        return;
    }

    var $ = require("jquery")(window);

    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

	$.support.cors = true;
	$.ajaxSettings.xhr = function() {
		return new XMLHttpRequest();
	};
	
	return $;
}

module.exports.init = function(welcomeCallback) {
	require('jsdom/lib/old-api').env("", function(err, window) {
    
		var $ = initAjax(err, window);
		
		$.ajax({ url: 'https://opentdb.com/api_count_global.php'
			, success: function(data) { 
				console.log("Chargement du nombre de questions OK !");
				var apiQuestionsNumber = data.overall.total_num_of_verified_questions;
				console.log(apiQuestionsNumber + ' questions en ligne!');
				welcomeCallback(apiQuestionsNumber);
			}, error: function(xhr, statusText, thrownError) {
				writeObj(xhr);
				console.log(statusText);
				writeObj(thrownError);
				var apiQuestionsNumber = '[???]';
				welcomeCallback(apiQuestionsNumber);
			}});	
	});
}

var questions = [];

function popQuestion() {
	var question = questions[0];
	questions.splice(0, 1);
	return question;
}

module.exports.nextQuestion = function(callback) {
	if(questions.length == 0) {
		require('jsdom/lib/old-api').env("", function(err, window) {
		
			var $ = initAjax(err, window);
			
			module.exports.apiQuestionsNumber = 0;
			
			$.ajax({ url: 'https://opentdb.com/api.php?amount=50&type=multiple'
				, success: function(data) { 
					console.log("Chargement de 50 nouvelles questions OK !");
					questions = data.results;
					for(var i=0; i<questions.length; i++) {
						var question = questions[i];
						question.question = $('<textarea />').html(question.question).text();
						question.correct_answer = $('<textarea />').html(question.correct_answer).text();
						for(var j=0; j<question.incorrect_answers.length; j++) {
							question.incorrect_answers[j] = $('<textarea />').html(question.incorrect_answers[j]).text();
						}
					}
					callback(popQuestion());
				}, error: function(xhr, statusText, thrownError) {
					writeObj(xhr);
					console.log(statusText);
					writeObj(thrownError);
					callback(null);
				}});	
		});
	} else {
		callback(popQuestion());
	}
}