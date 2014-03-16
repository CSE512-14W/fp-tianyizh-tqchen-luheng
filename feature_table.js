function feature_table(margin, width, height, tag) {
	this.width = width - margin.left - margin.right;
	this.height = height - margin.top - margin.bottom;
	this.margin = margin;
	
	this.barHeight = 20,
	this.barWidth = width * .8;
	
	this.duration = 400,

	this.tree_layout = d3.layout.tree()
	    	.size([0, 100]);

	this.diagonal = d3.svg.diagonal()
	    .projection(function(d) {
	    	return [d.y, d.x]; 
	    });

	this.node_color = function (d) {
		return d._children ? "#3182bd" : d.children ? "lightsteelblue" : "azure";
	};
	
	this.svg = d3.select(tag)
		.append("svg")
	    .attr("width", width)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

feature_table.prototype = {
	init : function(fdata) {
		var self = this;
		self.node_count = 0;
		// convert feature data to tree data
		self.feature_data = { x0 : 0,
							  y0 : 0,
							  name : "Features",
							  info : "Features",
							  type : "_",
							  children : fdata 
							};
		self.svg.selectAll("g.featnode").remove();
		self.update(self.feature_data);
	},
	update : function (source) {
		var self = this;
		var root = self.feature_data;
		var nodes = self.tree_layout.nodes(root);
		
		/*
		 * var height = Math.max(500,
				nodes.length * barHeight + self.margin.top + self.margin.bottom);
		d3.select("svg").attr("height", height);
		d3.select(self.frameElement).style("height", height + "px");
		*/
		
		nodes.forEach(function(d, i) {
			d.x = i * self.barHeight;
			d.y = d.depth <= 1 ? 0 : (d.depth - 1) * 5;
		});

		var node = self.svg.selectAll("g.featnode")
				.data(nodes, function(d) {
					return d.id || (d.id = ++ self.node_count);
				});

		var nodeEnter = node.enter()
			.append("g")
			.attr("class", "featnode")
			.attr("transform", function(d) {
				return "translate(" + source.y0 + "," + source.x0 + ")";
			})
			.style("opacity", 1e-6);

		nodeEnter.append("rect")
			.attr("y", - self.barHeight / 2)
			.attr("height", self.barHeight)
			.attr("width", self.barWidth)
			.style("fill", self.node_color)
			.on("click", function(d) {
				self.toggle(d);
				self.update(d);
			});

		nodeEnter.append("text")
			.attr("dy", 3.5)
			.attr("dx", 5.5)
			.text(function(d) {
				return d.name;
			});

		nodeEnter.transition()
			.duration(self.duration)
			.attr("transform", function(d) {
				return "translate(" + d.y + "," + d.x + ")";
			})
			.style("opacity", 1);

		node.transition()
			.duration(self.duration)
	  		.attr("transform", function(d) {
	  			return "translate(" + d.y + "," + d.x + ")";
	  		})
	  		.style("opacity", 1)
	  		.select("rect")
	  		.style("fill", self.node_color);

		node.exit()
			.transition()
			.duration(self.duration)
			.attr("transform", function(d) {
				return "translate(" + source.y + "," + source.x + ")";
			})
			.style("opacity", 1e-6)
			.remove();
		  
		nodes.forEach(function(d) {
		    d.x0 = d.x;
		    d.y0 = d.y;
		});
	},
	toggle : function(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
	}
};
