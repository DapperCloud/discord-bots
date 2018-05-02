var markov = (function() {

	this.Strategy = Object.freeze({ CHARACTER:1, WORD:2 });

	this.TextGenerator = function(strategy, order) {
		var chain = new MarkovChain(order);
		var order = order;
		var strategy = strategy;

		//Add text to the TG's database
		this.addText = function(text) {
			var cursor = 0;

			if(strategy == Strategy.WORD) {
				text = text.trim().replace(/\n|\r\n|\t/g, "");
				if(text.length < 3) return;
				if(!isTerminationChar(text[text.length-1])) text += ".";
				text = text.replace(/\.\.\./g, " … ").replace(/\./g, " . ").replace(/!/g, " ! ")
					.replace(/\?/g, " ? ").replace(/\:/g, " : ").replace(/;/g, " ; ").replace(/,/g, " , ");
				text = text.replace(/ +/g, " ").trim();
				text = text.split(" ");
			}

			if(text.length<order) return;

			chain.addTransition("", cutTextPortion(text, 0))
			while(cursor+order < text.length) {
				var current = cutTextPortion(text, cursor);
				if(isPunctuation(current[current.length-1])) {
					var isTerm = isTerminationChar(current[current.length-1]);
					if(isTerm) {
						chain.addTransition(current, "");
						cursor++;
					}
					var indexNext = findNextNonPunctuation(text, cursor+1);
					if(indexNext) {
						cursor = indexNext;
						if(isTerm) chain.addTransition("", cutTextPortion(text, cursor));
						else chain.addTransition(current, cutTextPortion(text, cursor));
					} else {
						return;
					}
						
				} else {
					var next = cutTextPortion(text, cursor+1);
					chain.addTransition(current, next);
					cursor++;
				}
			}
		}

		function findNextNonPunctuation(text, index) {
			var next = cutTextPortion(text, index);
			while(isPunctuation(next) && index+order < text.length) {
				index++;
				next = cutTextPortion(text, index);
			}
			if(!isPunctuation(next)) return index;
			return null;
		}

		function isPunctuation(char) {
			return isTerminationChar(char) || char === ":" || char === ";";
		}
		function isTerminationChar(char) {
			return char === "." || char === "!" || char === "?" || char === "…";
		}

		function cutTextPortion(text, index) {
			return text.slice(index, index+order);
		}

		this.generateText = function(iterationsMax) {
			var iterations = parseInt(iterations);
			var lastItem = chain.next("");
			var text = strategy == Strategy.WORD ? lastItem.join(" ") : lastItem;

			var count = 0;
			while(count < iterationsMax) {
				lastItem = chain.next(lastItem);
				if(lastItem === "") {
					lastItem = chain.next(lastItem);
					var addition = strategy == Strategy.WORD ? lastItem.join(" ") : lastItem;
				} else {
					var addition = lastItem[lastItem.length-1];	
				}
				if(strategy == Strategy.WORD && !isPunctuation(addition)) text += " ";
				text += addition;

				count++;
				if(count > 0.7*iterationsMax && isTerminationChar(addition)) return text;
			}

			return text;
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
				return vertices.length > 0 ? vertices[randomInt(vertices.length-1)] : null;
			}
		}
	}

	function randomInt(max) {
		return Math.floor(Math.random() * (max+1));
	}

	return this;
})();