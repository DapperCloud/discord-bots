var markov = (function() {

	this.MarkovChain = function(nodes) {

		this.nodes = nodes ? nodes : {};

		this.addTransition = function(prefix, suffix) {
			if(!(prefix in this.nodes)) this.nodes[prefix] = {};
			if(!(suffix in this.nodes[prefix])) this.nodes[prefix][suffix] = 0;

			this.nodes[prefix][suffix]++;
		}

		//Picks a random suffix
		this.next = function(prefix) {
			//console.log("call next from "+prefix);
			if(!(prefix in this.nodes)) return null;
			var suffixes = this.nodes[prefix];
			var probaSum = Object.values(suffixes).reduce((a,b) => a + b);
			var random = randomInt(probaSum);

			var tuples = [];

			for (var key in suffixes) tuples.push([key, suffixes[key]]);

			tuples.sort(function(a, b) {
			    a = a[1];
			    b = b[1];

			    return a < b ? -1 : (a > b ? 1 : 0);
			});

			var cumul = 0;
			for (var i = 0; i < tuples.length; i++) {
				var suffix = tuples[i][0];
			    var proba = tuples[i][1];
			    cumul += proba;
			    if (random <= cumul) return suffix;
			}
		}

		this.toString = function() {
			return Object.keys(this.nodes).map(prefix => "{ ("+prefix+") => "+Object.keys(this.nodes[prefix]).map(suffix => "("+suffix+":"+this.nodes[prefix][suffix]+")").join(" ")+" }\n");
		}
	}

	function randomInt(max) {
		return Math.floor(Math.random() * (max+1));
	}

	return this;
})();

module.exports = markov;