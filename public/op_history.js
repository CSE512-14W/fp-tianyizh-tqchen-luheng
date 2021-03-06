function op_history (margin, width, height, tag) {
	this.margin = margin;
    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;
    
    this.entry_width = width * 0.9;
    this.entry_height = 22;
    var x0 = margin.left;
    var y0 = margin.top;
    this.svg = d3.select(tag)
    			.append("svg")
    			.attr("width", width)
    			.attr("height", height)
    			.append("g")
    			.attr("transform", "translate(" + x0 + ", " + y0 + ")");
    			
    this.panel = this.svg.append("g")
    				.attr("class", "history");
}

op_history.prototype = {
	add_hint : function() {
		d3.selectAll(".hint").selectAll("p").remove();
		d3.select(".hint").append("p")
			.text("[Logs]: Showing history of user interactions. Right click on a non-latest history entry to rollback.");
	},
	clear : function() {
		this.header = ["operation", ];
		this.ops = [];
	    this.evals = [];
	    this.sources = [];
	    this.active_op_id = 0;
		this.char_to_pxl = 5.5;
	},
	update : function(request, response, source) {
		var self = this;
		tooltips.clear();
		
		if (request.op_type != "restore_op") {
			var log_content = self.op_log_helper(request);
			if (self.timeTravaled()) {
				self.ops = this.ops.slice(0, self.active_op_id);
				self.evals = this.evals.slice(0, self.active_op_id);
				self.sources = this.sources.slice(0, self.active_op_id);
			}
			self.ops.push(log_content);
			self.evals.push( {
					test_error: 100.0 * response.test_error,
					train_error : 100.0 * response.train_error} );
			self.sources.push(source);
		}
		self.active_op_id = response.op_iter;
		self.panel.selectAll("rect").remove();
		self.panel.selectAll("text").remove();
		
		var current_height = self.ops.length * self.entry_height
							+ self.margin.top + self.margin.bottom;
		console.log("current_height", current_height);
		d3.select("svg")
			.attr("height", current_height);
		
		var opEnter = self.panel
			.selectAll("rect")
			.data(self.ops.concat(self.header))
			.enter();
		
		opEnter.append("rect")
			.attr("x", 0)
			.attr("y", function(d, i) {
				var k = self.ops.length - i;
				return k * self.entry_height;
			})
			.attr("width", self.entry_width)
			.attr("height", self.entry_height)
			.on("mouseover", function(d, i) {
				if (i != self.active_op_id - 1 && i < self.ops.length) {
					d3.select(this).classed("active", true);
				}
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
			})
			.on("contextmenu", function(d, i) {
				if (i == self.active_op_id - 1) {
					return;
				}
				var xx =  60;
				var yy = (self.ops.length - i) * self.entry_height;
				tooltips.clear();
				tooltips.add(self.svg, d, xx, yy, {
						user_id : main_user_id,
						op_type : "restore_op",
						op_iter : i,
						node_id : 0,
						tree_id : 0,
						num_trees : btrees.num_trees
					});
				d3.event.preventDefault();
			});
			
		opEnter.append("text")
			.attr("x", 10)
			.attr("y", function(d, i) {
				var k = self.ops.length - i;
				return (k + 0.6) * self.entry_height;
			})
			.attr("text-anchor", "left")
			.text(function(d, i) {
				return d;
			})
			.style("font-weight", function(d, i) {
				return (i == self.ops.length) ? "bold" : "normal";
			})
			.style("opacity", function(d, i) {
				return (i == self.ops.length || i < self.active_op_id) ?
						1.0 : 0.5; 
			});
		
		opEnter.append("text")
			.attr("x", self.entry_width * 0.4)
			.attr("y", function(d, i) {
				var k = self.ops.length - i;
				return (k + 0.6) * self.entry_height;
			})
			.attr("text-anchor", "left")
			.text(function(d, i) {
				return i == self.ops.length ?
					"train-error" :
					self.evals[i].train_error.toFixed(2) + "%";
			})
			.style("font-weight", function(d, i) {
				return (i == self.ops.length) ? "bold" : "normal";
			})
			.style("opacity", function(d, i) {
				return (i == self.ops.length || i < self.active_op_id) ?
						1.0 : 0.5; 
			});
		
		opEnter.append("text")
			.attr("x", self.entry_width * 0.7)
			.attr("y", function(d, i) {
				var k = self.ops.length - i;
				return (k + 0.6) * self.entry_height;
			})
			.attr("text-anchor", "left")
			.text(function(d, i) {
				return i == self.ops.length ?
						"test-error" :
						self.evals[i].test_error.toFixed(2) + "%";
			})
			.style("font-weight", function(d, i) {
				return (i == self.ops.length) ? "bold" : "normal";
			})
			.style("opacity", function(d, i) {
				return (i == self.ops.length || i < self.active_op_id) ?
						1.0 : 0.5; 
			});
	},
	op_log_helper : function(request) {
		if (request.op_type === "init") {
			return "Initialize tree";
		} else {
			return request.op_type;
			// + " on " + request.tree_id + ", " + request.node_id;
		}
	},
	timeTravaled : function() {
		return this.active_op_id < this.ops.length;
	}
};