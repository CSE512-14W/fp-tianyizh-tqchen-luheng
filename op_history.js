function op_history (margin, width, height, tag) {
	this.margin = margin;
    this.width = width - margin.left -margin.right;
    this.height = height - margin.top - margin.bottom;
    
    this.entry_width = 240;
    this.entry_height = 24;
    var x0 = margin.left + (this.width - this.entry_width) * 0.5;
    var y0 = margin.top;
    this.svg = d3.select(tag)
    			.append("svg")
    			.attr("width", this.width + margin.left + margin.right)
    			.attr("height", this.height + margin.top + margin.bottom )
    			.append("g")
    			.attr("transform", "translate(" + x0 + ", " + y0 + ")");
    			
    this.panel = this.svg.append("g")
    				.attr("class", "history");
    			
    this.tooltips = new op_tooltips(this.svg);
    this.ops = [];
    this.active_op_id = 0;
	this.char_to_pxl = 5.5;
}

op_history.prototype = {
	update : function(request, response) {
		var self = this;
		
		if (request.op_type != "restore_op") {
			var log_content = self.op_log_helper(request);
			if (self.active_op_id < self.ops.length) {
				self.ops = this.ops.slice(0, self.active_op_id);
			}
			self.ops.push(log_content);
		}
		self.active_op_id = response.op_iter;
		console.log(this.ops, this.active_op_id);
		
		self.panel.selectAll("rect").remove();
		self.panel.selectAll("text").remove();
		
		var opEnter = self.panel
			.selectAll("rect")
			.data(self.ops)
			.enter();
		
		opEnter.append("rect")
			.attr("x", 0)
			.attr("y", function(d, i) {
				return i * self.entry_height;
			})
			.attr("width", self.entry_width)
			.attr("height", self.entry_height)
			.on("mouseover", function(d, i) {
				if (i != self.active_op_id - 1) {
					d3.select(this).classed("active", true);
				}
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
			})
			.on("contextmenu", function(d, i) {
				self.tooltips.clear();
				btrees.tooltips.clear();
				if (i == self.active_op_id - 1) {
					return;
				}
				var xx = self.entry_width + 4;
				var yy = i * self.entry_height;
				self.tooltips.add(xx, yy, {
						op_type : "restore_op",
						op_iter : i,
						node_id : 0,
						tree_id : 0,
						num_trees : btrees.num_trees});
				d3.event.preventDefault();
			});
			
		opEnter.append("text")
			.attr("x", self.entry_width / 2)
			.attr("y", function(d, i) {
				return (i + 0.6) * self.entry_height;
			})
			.attr("text-anchor", "middle")
			.text(function(d) {
				return d;
			})
			.style("opacity", function(d, i) {
				return (i < self.active_op_id ? 1.0 : 0.5); 
			});
		
		// clear tooltips ...
		self.tooltips.clear();
	},
	op_log_helper : function(request) {
		if (request.op_type === "init") {
			return "Initialize tree";
		} else {
			return request.op_type + " on " + request.tree_id + ", " + request.node_id;
		}
	}
};