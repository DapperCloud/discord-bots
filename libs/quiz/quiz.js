var quiz = (function() {

	// Compute the edit distance between the two given strings
	this.getEditDistance = function(a, b) {
		if(a.length == 0) return b.length; 
		if(b.length == 0) return a.length; 

		var matrix = [];

		// increment along the first column of each row
		var i;
		for(i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		// increment each column in the first row
		var j;
		for(j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		// Fill in the rest of the matrix
		for(i = 1; i <= b.length; i++) {
			for(j = 1; j <= a.length; j++) {
				if(b.charAt(i-1) == a.charAt(j-1)) {
					matrix[i][j] = matrix[i-1][j-1];
				} else {
					matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
					Math.min(matrix[i][j-1] + 1, // insertion
					matrix[i-1][j] + 1)); // deletion
				}
			}
		}

		return matrix[b.length][a.length];
	};

	this.normalizeAnswer = function(str) {
		str = str.trim().toLowerCase().replace(/\*/g, '');
		if(str.includes(' ')) {
			var firstWord = str.split(' ')[0];
			if(['le','la','les','un','une','des','en','à','dans','par','pour','vers','au'].includes(firstWord)) {
				str = str.slice(firstWord.length+1);
			}
		}
		if(str.slice(0,2) === 'l\'') {
			str = str.slice(2);
		}
		return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
	}

	this.isCorrectAnswer = function(answer, expected, charactersByMistake) {
		normalizedAnswer = normalizeAnswer(answer);
		normalizedExpected = normalizeAnswer(expected);
		return normalizedAnswer.includes(normalizedExpected) 
			|| getEditDistance(normalizedAnswer, normalizedExpected) <= normalizedAnswer.length / charactersByMistake;
	}

	return this;
})();

module.exports = quiz;