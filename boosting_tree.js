/**
 * boosting tree visualizer 
 */

function boosting_tree (margin, width, height, tag, enable_toggle) {
	this.margin = margin;
    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;
    this.enable_toggle = enable_toggle;
    
    this.svg = d3.select(tag)
    			.append("svg")
    			.attr("width", width + margin.left + margin.right)
    			.attr("height", height + margin.top + margin.bottom )
    			.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    this.forest = []; 
    this.diagonal = d3.svg
    			.diagonal()
    			.projection( function(d) { return [d.x, d.y]; });
    
    this.node_count = 0;
    this.tree_margin = 20;
    
    this.rect_width = 60,
    this.rect_height = 20,
	this.max_link_width = 20,
	this.min_link_width = 1.5,
	this.char_to_pxl = 5.5;

    this.stroke_callback = "#ccc";
    this.duration = d3.event && d3.event.altKey ? 5000 : 500;
}

boosting_tree.prototype = {
	init : function(tdata) {
		var self = this;
		self.root_nodes = tdata.roots;
		self.root_weights = tdata.weights;
		self.tree_nodes = tdata.nodes;
		self.num_nodes = self.tree_nodes.length;
		self.num_trees = self.root_nodes.length;
		self.parent_ptr = new Array(self.num_nodes);		
		// change data to d3 tree json style with field "label", "type"
		self.forest_data = [];
		self.forest = [];
		self.tree_width = self.width / self.num_trees;
		for (var i = 0; i < self.num_trees; i++) {
			self.forest_data.push(
				self.recursive_tree_helper(self.root_nodes[i], -1, i));
			// using d3 tree layout: https://github.com/mbostock/d3/wiki/Tree-Layout
			self.forest.push(
				d3.layout.tree().size([self.tree_width - self.tree_margin,
				                       self.height]));
		}
			
		/**
		 * Prepare for update.
		 */
		self.first_root = self.forest_data[0];
		self.num_samples = self.first_root.samples;
		if (self.enable_toggle) {
			for (var i = 0; i < self.num_trees; i++) {
				self.forest_data[i].children.forEach(self.toggleAll);
			}
		}
		self.link_stroke_scale = d3.scale.linear()
				.domain([0, self.num_samples])
				.range([self.min_link_width, self.max_link_width]);
		
		self.first_root.x0 = 0;
		self.first_root.y0 = 0;
		self.update(self.first_root);  
	},
	recursive_tree_helper : function (node_id, parent_id, my_rank) {
		var node = this.tree_nodes[node_id];
		this.parent_ptr[node_id] = parent_id;
		if (node.children) {
			var c_nodes = [];
			for (var i = 0; i < node.children.length; i++) {
				c_nodes.push(
					this.recursive_tree_helper(node.children[i], node_id, i));
			}
			return { node_id : node_id, label : node.label, type : "split",
					children : c_nodes, rank : my_rank,
					samples : node.pos_cnt + node.neg_cnt,
					weight : 1.0 };
		} else {
			var leaf_weight = parseFloat(node.label.split("=")[1]);
			return { node_id : node_id, label : node.label, type : "leaf",
					rank : my_rank, samples : node.pos_cnt + node.neg_cnt,
					weight : leaf_weight};
		}
	},
	path_helper : function (d) {
		path = [];
		for (var p = d.node_id; p >= 0; p = this.parent_ptr[p]) {
			path.push(this.tree_nodes[p]);
		}
		return path.reverse();
	},
	toggle : function (d) {
		if (!self.enable_toggle) {
			return;
		}
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
		var self = this;
	
		// compute all the nodes in tree layout according to current data
		var nodes = [],
			links = [];
		for (var i = 0; i < self.num_trees; i++) {
			var tree = self.forest[i];
			var tree_data = self.forest_data[i];
			var t_nodes = tree.nodes(tree_data).reverse();
			t_nodes.forEach(function(d) {
				d.x = d.x + i * self.tree_width;
				d.y = d.depth * 80 + (d.rank * (self.rect_height + 8));
			});
			nodes.push.apply(nodes, t_nodes);
			links.push.apply(links, tree.links(t_nodes));
		}
		
		// data binding for nodes and links
		var node = self.svg.selectAll("g.node")
		   	 	.data(nodes, function(d) {
		   	 		return d.id || (d.id = ++ self.node_count); });
		var link = self.svg
				.selectAll("path.link")
				.data(links, function(d) {
					return d.target.id; });
		
		var node_box_width = function(label) {
	    	var text_len = label.length * self.char_to_pxl + 15;
	    	var width = d3.max([self.rect_width, text_len]);
	    	return width;
	    };
	    
		var nodeEnter = node.enter()
			.append("g")
			.attr("class", "node")
			.attr("transform", function(d) {
				return "translate(" + source.x0 + "," + source.y0 + ")"; })
			.on("click", function(d) { 
				if (self.enable_toggle) {
					self.toggle(d);
					self.update(d);
				} else {
					// try to show a tooltip
					self.svg.select("g.tooltip").remove();
					var tooltip = self.svg.append("g")
						.attr("class", "tooltip");
				
					var xx = d.x + node_box_width(d.label) / 2;
					var yy = d.y;
					
					tooltip.append("rect")
						//.transition().duration(self.duration)
						.attr("class", "tooltip")
						.attr("x", xx)
						.attr("y", yy)
						.attr("rx", 2)
						.attr("ry", 2)
						.attr("width", 120)
						.attr("height", 30)
						.attr("fill", "purple")
						.attr("opacity", 0.3)
						.on("mouseout", function() {
							tooltip.select("rect").remove();
							tooltip.select("text").remove();
						})
						.on("click", function() {
							$.get("cgi-bin/dummy.py",
								{ query : "dummy", node_id : d.node_id, label : d.label },
								function(result){
									console.log(result);
								});
						});
					tooltip.append("text")
						.text(d.type === "leaf" ? "+ Expand this node" : " - Remove this node")
						.attr("x", xx + 50)
						.attr("y", yy + 15)
						.attr("text-anchor", "middle")
						.attr("fill", "black")
						.style("fill-opacity", "1")
						.style("pointer-events", "none"); // disable mouseover text
				}
			})
			.on("mouseover", function(d) {
				gtreepath.update(self.path_helper(d));
			});

		nodeEnter.append("rect")
		   .attr("x", function(d) {
			   return - node_box_width(d.label) / 2;
		   })
		   .attr("width", 1e-6)
		   .attr("height", 1e-6);
		
		nodeEnter.append("text")
		   .attr("dy", "12px")
		   .attr("text-anchor", "middle")
		   .text(function(d) {
			   return d.label; })
		   .style("fill-opacity", 1e-6);
	
		// for every existing nodes
		var nodeUpdate = node.transition()
	      .duration(self.duration)
	      .attr("transform", function(d) {
	    	  return "translate(" + d.x + "," + d.y + ")"; });
	 
		nodeUpdate.select("rect")
			.attr("width", function(d) {
				return node_box_width(d.label);
			})
			.attr("height", self.rect_height)
			.attr("rx", 2)
			.attr("ry", 2)
			.style("stroke", function(d) {
				return d.type === "split" ? "steelblue" : "olivedrab";})
			.style("fill", function(d) {
				if (d.type === "leaf") {
					return d.weight > 0 ? "steelblue" : "brown";
				}
				return d._children ? "lightsteelblue" : "#fff"; })
			.style("opacity", 0.6);
	 
		nodeUpdate
			.select("text")
			.style("fill-opacity", 1);
	 
		// For nodes that no longer bind with data ...
		var nodeExit = node.exit().transition()
			.duration(self.duration)
			.attr("transform", function(d) {
				return "translate(" + source.x + "," + source.y + ")"; })
			.remove();
	 
		nodeExit.select("rect").remove();/*
			.attr("width", 1e-6)
			.attr("height", 1e-6);*/
	 
		nodeExit.select("text")
			.style("fill-opacity", 1e-6);
		
		// new links induced
		link.enter().insert("path", "g")
			.attr("class", "link")
			.attr("d", function(d) {
				var o = { x: source.x0, y: source.y0};
				return self.diagonal({source: o, target: o});
			})
			.transition()
			.duration(self.duration)
			.attr("d", self.diagonal)
			.style("stroke-width", function(d) {
				return self.link_stroke_scale(d.target.samples);})
			.style("stroke", self.stroke_callback);
	 
		// existing links
		link.transition()
			.duration(self.duration)
			.attr("d", self.diagonal)
			.style("stroke-width", function(d) {
				return self.link_stroke_scale(d.target.samples);})
			.style("stroke", self.stroke_callback);
	 
		// removed links
		link.exit().transition()
			.duration(self.duration)
			.attr("d", function(d) {
				var o = {x: source.x, y: source.y};
				return self.diagonal({source: o, target: o});
			})
			.remove();
	 
		// backup locations0
		nodes.forEach(function(d) {
		    d.x0 = d.x;
		    d.y0 = d.y;
		});
	}
}