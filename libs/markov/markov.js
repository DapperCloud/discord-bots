var markov = (function() {
	this.Strategy = Object.freeze({ CHARACTER:1, WORD:2 });

	this.TextGenerator = function(strategy, order) {
		var chain = new MarkovChain(order);
		var order = order;
		var strategy = strategy;

		//Add text to the TG's database
		this.addText = function(text) {
			var circularText = null;
			if(strategy == Strategy.CHARACTER) {
				circularText = text + text.slice(0, order);
			} else if (strategy == Strategy.WORD) {
				circularText = text.split(" ");
				for(var i=0; i<order; i++) {
					circularText.push(circularText[i]);
				}
			}

			var cursor = 0;
			while(cursor+order < circularText.length) {
				var current = cutTextPortion(circularText, cursor);
				var next = cutTextPortion(circularText, cursor+1);
				chain.addTransition(current, next);
				cursor++;
			}
		}

		function cutTextPortion(text, index) {
			return text.slice(index, index+order);
		}

		this.generateTextWithStart = function(iterations, start) {
			var iterations = parseInt(iterations);
			var lastItem = start;
			var lastChar = null;

			if(strategy == Strategy.WORD) {
				var text = start.join(" ");
			} else {
				var text = start;
			}

			function newIteration() {
				var newChar = chain.next(lastItem);
				if(strategy == Strategy.WORD) text += " ";
				text += newChar;
				lastItem = lastItem.slice(1);
				if(strategy == Strategy.CHARACTER) {
					lastItem += newChar;
				} else {
					lastItem.push(newChar);
				}
				lastChar = newChar;
			}

			for(var i=0; i<iterations; i++) {
				newIteration();
			}

			var charToTerminate = strategy == Strategy.CHARACTER ? " " : ".";
			if(text.includes(charToTerminate)) {
				//Keep going until we have the termination char. Can't exceed 150% of iterations.
				var count = 0;
				while(count < iterations/2 && text.slice(text.length-1) != charToTerminate) {
					newIteration();
					count++;
				}
			}

			return text;
		}

		//Generates from a random start
		this.generateText = function(iterations) {
			var keys = Object.keys(chain.nodes);
			var randomIndex = randomInt(keys.length-1);
			var key = keys[randomIndex];
			return this.generateTextWithStart(iterations, chain.nodes[key].getValue());
		}

		this.chainString = function() {
			return chain.toString();
		}

	}

	this.MarkovChain = function(order) {
		var order = order;

		this.nodes = [];

		this.addTransition = function(stringFrom, stringTo) {
			if(!(stringFrom in this.nodes)) this.nodes[stringFrom] = new Node(stringFrom);
			if(!(stringTo in this.nodes)) this.nodes[stringTo] = new Node(stringTo);

			this.nodes[stringFrom].addVerticeTo(this.nodes[stringTo]);
		}

		//Picks a random next item
		this.next = function(fromValue) {
			var toNode = this.nodes[fromValue].pickRandomVertice().getValue();
			return toNode[toNode.length-1] //The item is the last element of the node's value;
		}

		this.toString = function() {
			return "Nodes { " + Object.keys(this.nodes).join("; ") + " }\n"+
				"Vertices:\n" + Object.keys(this.nodes).map(val => "{ ("+val+") => "+this.nodes[val].getVertices().map(n=>n.getValue()).join("; ")+" }\n");
		}

		var Node = function(string) {
			var value = string;
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
				return vertices[randomInt(vertices.length-1)]
			}
		}
	}

	function randomInt(max) {
		return Math.floor(Math.random() * (max+1));
	}

	return this;
})();