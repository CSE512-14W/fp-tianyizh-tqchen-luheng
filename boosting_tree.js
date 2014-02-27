/**
 * boosting tree visualizer 
 */

function boosting_tree (margin, width, height, tag) {
	this.margin = margin;
    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;

    this.svg = d3.select(tag)
    			.append("svg")
    			.attr("width", width + margin.left + margin.right)
    			.attr("height", height + margin.top + margin.bottom )
    			.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    this.tree = d3.layout
    			.tree()
    			.size([width, height]);
    
    this.diagonal = d3.svg
    			.diagonal()
    			.projection( function(d) { return [d.x, d.y]; });
    
    this.node_count = 0;
}

boosting_tree.prototype = {
	mock_init : function() {
		var self = this;
		d3.json( "data/mushroom.json",
			function(error, tdata) {
				self.roots = tdata.roots;
				self.weights = tdata.weights;
				self.tree_nodes = tdata.nodes;
				
				// change data to d3 tree json style,
				// with field "label", "type" 
				self.forest = [];
				for (var i = 0; i < self.roots.length; i++) {
					self.forest.push(
						self.recursive_tree_helper(self.roots[i]));
				}
				/**
				 * Prepare for update.
				 */
				self.num_samples = 1000;
				self.root = self.forest[0];
				self.root.x0 = 0;
				self.root.y0 = 0;
				self.root.children.forEach(self.toggleAll);
				self.update(self.root);
			});    
	},
	recursive_tree_helper : function (node_id) {
		var node = this.tree_nodes[node_id];
		if (node.children) {
			var c_nodes = [];
			for (var i = 0; i < node.children.length; i++) {
				c_nodes.push(
					this.recursive_tree_helper(node.children[i]));
			}
			return { label : node.label, type : "split", children : c_nodes,
					samples : 100 };
		} else {
			return { label : node.label, type : "leaf", samples : 50 };
		}
	},
	toggle : function (d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
	},	
	toggleAll : function (d) {
		if (d && d.children) {
			for (var i = 0; i < d.children.length; i++) {
				// FIXME: why this.toggleAll doesn't work? i don't understand..
				boosting_tree.prototype.toggleAll(d.children[i]);
			}
			boosting_tree.prototype.toggle(d);
		}
	},
	update : function(source) {
		var rect_width = 60,
			rect_height = 20,
			max_link_width = 20,
			min_link_width = 1.5,
			char_to_pxl = 6;
		var self = this;
		
		/**
		 * NODES
		 */
		var nodes = self.tree.nodes(self.root).reverse();
		nodes.forEach(function(d) {
			d.y = d.depth * 80; });

		var node = self.svg.selectAll("g.node")
		   	 	.data(nodes, function(d) {
		   	 		return d.id || (d.id = ++ self.node_count) ; });

		/**
		 * NODE ENTER
		 */
		var nodeEnter = node.enter()
			.append("g")
			.attr("class", "node")
			.attr("transform", function(d) {
				return "translate(" + source.x0 + "," + source.y0 + ")"; })
			.on("click", function(d) { 
				self.toggle(d);
				self.update(d); });

		nodeEnter.append("rect")
		   .attr("x", function(d) {
			   var text_len = d.label.length * char_to_pxl;
			   var width = d3.max([rect_width, text_len]);
			   return -width / 2;
		   })
		   .attr("width", 1e-6)
		   .attr("height", 1e-6)
		   .attr("rx", function(d) {
			   return d.type === "split" ? 2 : 0;})
		   .attr("ry", function(d) {
			   return d.type === "split" ? 2 : 0;})
		   .style("stroke", function(d) {
			   return d.type === "split" ? "steelblue" : "olivedrab";})
		   .style("fill", function(d) {
			   // is expandable
			   return d._children ? "lightsteelblue" : "#fff"; });

		nodeEnter.append("text")
		   .attr("dy", "12px")
		   .attr("text-anchor", "middle")
		   .text(function(d) {
			   return d.label; })
		   .style("fill-opacity", 1e-6);
		
		var duration = d3.event && d3.event.altKey ? 5000 : 500;
		var nodeUpdate = node.transition()
	      .duration(duration)
	      .attr("transform", function(d) {
	    	  return "translate(" + d.x + "," + d.y + ")"; });
	 
		/**
		 * NODE UPDATE
		 */
		nodeUpdate.select("rect")
			.attr("width", function(d) {
				var text_len = d.label.length * char_to_pxl;
				var width = d3.max([rect_width, text_len]);
				return width; })
			.attr("height", rect_height)
			.style("fill", function(d) {
				return d._children ? "lightsteelblue" : "#fff"; });
	 
		nodeUpdate
			.select("text")
			.style("fill-opacity", 1);
	 
		/**
		 * NODE EXIT
		 */
		var nodeExit = node.exit().transition()
			.duration(duration)
			.attr("transform", function(d) {
				return "translate(" + source.x + "," + source.y + ")"; })
			.remove();
	 
		nodeExit.select("rect")
			.attr("width", 1e-6)
			.attr("height", 1e-6);
	 
		nodeExit.select("text")
			.style("fill-opacity", 1e-6);
	  
		/**
		 * LINKS
		 */
		var links = self.tree.links(nodes);
		var link = self.svg
					.selectAll("path.link")
					.data(links, function(d) {
						return d.target.id; });
		
		var link_stroke_scale = d3.scale.linear()
				.domain([0, self.num_samples])
				.range([min_link_width, max_link_width]);
		var stroke_callback = "#ccc";
		
		/**
		 * LINK ENTER
		 */
		link.enter().insert("path", "g")
			.attr("class", "link")
			.attr("d", function(d) {
				var o = { x: source.x0, y: source.y0};
				return self.diagonal({source: o, target: o});
			})
			.transition()
			.duration(duration)
			.attr("d", self.diagonal)
			.style("stroke-width", function(d) {
				return link_stroke_scale(d.target.samples);})
			.style("stroke", stroke_callback);
	 
		/**
		 * LINK UPDATE
		 */
		
		link.transition()
			.duration(duration)
			.attr("d", self.diagonal)
			.style("stroke-width", function(d) {
				return link_stroke_scale(d.target.samples);})
			.style("stroke", stroke_callback);
	 
		/**
		 * LINK EXIT
		 */
		link.exit().transition()
			.duration(duration)
			.attr("d", function(d) {
				var o = {x: source.x, y: source.y};
				return self.diagonal({source: o, target: o});
			})
			.remove();
	 
		nodes.forEach(function(d) {
		    d.x0 = d.x;
		    d.y0 = d.y;
		});
	}
};