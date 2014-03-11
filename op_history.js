function op_history (margin, width, height, tag) {
	this.margin = margin;
    this.width = width - margin.left -margin.right;
    this.height = height - margin.top - margin.bottom;
    
    this.entry_width = 300;
    this.entry_height = 20;
    var x0 = margin.left + (this.width - this.entry_width) * 0.5;
    var y0 = margin.top;
    this.svg = d3.select(tag)
    			.append("svg")
    			.attr("width", this.width + margin.left + margin.right)
    			.attr("height", this.height + margin.top + margin.bottom );
    			
    this.panel = this.svg.append("g")
    				.attr("class", "history")
    				.attr("transform", "translate(" + x0 + ", " + y0 + ")");
    			
    this.tooltips = new op_tooltips(this.panel);
    this.ops = [];
    this.active_op_id = -1;
	this.char_to_pxl = 5.5;
}

op_history.prototype = {
	add : function(request) {
		var log_content = this.op_log_helper(request);
		if (this.active_op_id < this.ops.length - 1) {
			this.ops = this.ops.slice(0, this.active_op_id + 1);
		}
		this.ops.push(log_content);
		this.active_op_id ++;
		console.log(this.ops, this.active_op_id);
	},
	update : function() {
		var self = this;
		var opEnter = self.panel
			.selectAll("rect")
			.data(self.ops)
			.enter();
		
		console.log(self.ops);
		
		opEnter.append("rect")
			.attr("x", 0)
			.attr("y", function(d, i) {
				return i * self.entry_height;
			})
			.attr("width", self.entry_width)
			.attr("height", self.entry_height)
			.on("mouseover", function() {
				d3.select(this).classed("active", true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
			})
			.on("click", function(d, i) {
				self.tooltips.clear();
				btrees.tooltips.clear();
				if (i == 0 || i == self.active_op_id) {
					return;
				}
				var xx = self.entry_width + 2;
				var yy = i * self.entry_height;
				self.tooltips.add(xx, yy, {
						op_type : "restore_history",
						op_iter : self.op_iter,
						node_id : 0,
						tree_id : 0,
						num_trees : btrees.num_trees});
				});
		
		opEnter.append("text")
			.attr("x", self.entry_width / 2)
			.attr("y", function(d, i) {
				return (i + 0.6) * self.entry_height;
			})
			.attr("text-anchor", "middle")
			.text(function(d) {
				return d;
			});
	},
	op_log_helper : function(request) {
		if (request.op_type === "init") {
			return "Initialize tree";
		} else {
			return request.op_type + " on " + request.tree_id + ", " + request.node_id;
		}
	}
};