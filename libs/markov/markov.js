var markov = (function() {

	this.removeLinks = function(str) {
		return str.replace(/https?\:\/\/[^ ]*/g,"").replace(/www\.[^ ]*/g,"");
	}

	this.MarkovChain = function() {

		this.nodes = [];

		this.addTransition = function(ngramFrom, ngramTo) {
			if(!(ngramFrom in this.nodes)) this.nodes[ngramFrom] = new Node(ngramFrom);
			if(!(ngramTo in this.nodes)) this.nodes[ngramTo] = new Node(ngramTo);

			this.nodes[ngramFrom].addVerticeTo(this.nodes[ngramTo]);
		}

		//Picks a random next node
		this.next = function(fromValue) {
			if(this.nodes[fromValue].getVertices().length == 0) this.addTransition(fromValue, "");
			var toNode = this.nodes[fromValue].pickRandomVertice();
			return toNode ? toNode.getValue() : null;
		}

		this.toString = function() {
			return "Nodes { " + Object.keys(this.nodes).join("; ") + " }\n"+
				"Vertices:\n" + Object.keys(this.nodes).map(val => "{ ("+val+") => "+this.nodes[val].getVertices().map(n=>n.getValue()).join("; ")+" }\n");
		}

		var Node = function(ngram) {
			var value = ngram;
			var vertices = []; //vertices from this node
			this.getValue = function() { 
				return value; 
			}
			this.getVertices = function() {
				return vertices;
			}
			this.addVerticeTo = function(node) { 
				vertices.push(node); 
			}
			this.pickRandomVertice = function() {
				return vertices.length > 0 ? vertices[randomInt(vertices.length-1)] : null;
			}
			this.getSuffix = function() {
				return value[value.length-1];
			}
		}
	}

	function randomInt(max) {
		return Math.floor(Math.random() * (max+1));
	}

	return this;
})();

module.exports = markov;