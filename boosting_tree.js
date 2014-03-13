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
    			.attr("width", this.width + margin.left + margin.right)
    			.attr("height", this.height + margin.top + margin.bottom )
    			.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
   
    this.tooltips = new op_tooltips(this.svg);
    this.diagonal = d3.svg
    			.diagonal()
    			.projection( function(d) { return [d.x, d.y]; });
    this.tree_margin = 20;
    this.rect_width = 60,
    this.rect_height = 22,
	this.max_link_width = 20,
	this.min_link_width = 1.5,
	this.char_to_pxl = 6;

    this.stroke_callback = "#ccc";
    this.duration = d3.event && d3.event.altKey ? 5000 : 500;
    
    this.clear();
}

boosting_tree.prototype = {
	clear : function() {
		this.node_count = 0;
	    this.node_mapper = {};
	    this.tree_layout = [];
	    this.is_collapsed = [];
	},
	init : function(tdata) {
		var self = this;
		self.forest_data = tdata.forest;
		//console.log(self.forest_data);
		self.forest = [];
		self.num_trees = self.forest_data.length;
		self.tree_width = self.width / self.num_trees;
		
		for (var i = 0; i < self.num_trees; i++) {
			// only use node_id of last time ..
			self.node_id_helper(self.forest_data[i]);
			if (i < self.is_collapsed.length && self.is_collapsed[i]) {
				self.toggle(self.forest_data[i]);
			}
		}
		
		self.first_root = self.forest_data[0];
		self.num_samples = self.first_root.samples;
		if (self.enable_toggle) {
			for (var i = 0; i < self.num_trees; i++) {
				if (forest_data[i].children) {
					for (var j = 0; j < forest_data[i].children.length; j++) {
						self.toggleAll(forest_data[i].children[j]);
					}
				}
			}
		}
		self.link_stroke_scale = d3.scale.linear()
				.domain([0, self.num_samples])
				.range([self.min_link_width, self.max_link_width]);
		self.first_root.x0 = 0;
		self.first_root.y0 = 0;
		self.update(self.first_root);
	},
	node_id_helper : function (node) {
		var old_id = this.node_mapper[[node.tree_id, node.node_id]];
		if (old_id != null) {
			node.id = old_id;
		}
		if (node.children) {
			for (var i = 0; i < node.children.length; i++) {
				this.node_id_helper(node.children[i]);
			}
		}
	},
	path_helper : function (d) {
		path = [];
		for (var nd = d; nd != null; nd = nd.parent) {
			path.push(nd);
		}
		return path.reverse();
	},
	toggle : function (d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
			return 0;
		} else {
			d.children = d._children;
			d._children = null;
			return 1;
		}
	},	
	toggleAll : function (d) {
		if (d && d.children) {
			for (var i = 0; i < d.children.length; i++) {
				this.toggleAll(d.children[i]);
			}
			this.toggle(d);
		}
	},
	tree_layout_helper : function() {
		var self = this;
		var layout = [];
		var width = function(d) {
			// TODO: estimate width smarter
			return d.children ? 600 : 100;
		};
		var height = function(d) {
			return 800;
		};
		var total_width = 0;
		for (var i = 0; i < self.num_trees; i++) {
			total_width += width(self.forest_data[i]);
		}
		if (total_width >= self.width) {
			// auto collapse trees
			// ???
		}
		var last_x = 200;
		var last_y = -50;
		var offset_x = 0, offset_y = 0;
		var t_width = 0, t_height = 0;
		for (var i = 0; i < self.num_trees; i++) {
			var root = self.forest_data[i];
			if (root._children) {
				offset_x = 50;
				offset_y = last_y + 50;
				last_y = offset_y;
			} else {
				t_width = width(root);
				t_height = height(root);
				if (i > 0) {
					offset_x = last_x + self.tree_margin;
					offset_y = 0;
					last_x = offset_x;
				} else {
					offset_x = 100;
					offset_y = 0;
				}
				last_x = offset_x + t_width;
			}
			console.log(i, offset_x, offset_y, last_x, last_y);
			layout.push( { width : t_width, height : t_height,
				offset : { x : offset_x, y : offset_y} } );
		}
		return layout;
	},
	update : function(source) {
		var self = this;
			
		// remove tooltips and update history
		self.tooltips.clear();
		history.tooltips.clear();
		
		var nodes = [],
			links = [];
		
		// compute tree layout info
		self.tree_layout = self.tree_layout_helper();
		
		for (var i = 0; i < self.num_trees; i++) {
			var tree = d3.layout.tree()
				.size([self.tree_layout[i].width, self.tree_layout[i].height]);
			var tree_data = self.forest_data[i];
			var t_nodes = tree.nodes(tree_data);
			if (tree_data._children) {
				t_nodes.forEach(function(d) {
					d.x = self.tree_layout[i].offset.x;
					d.y = self.tree_layout[i].offset.y;
				});
			}
			t_nodes.forEach(function(d) {
				// computing absolute node position
				//if (!d.parent) console.log(d.x);
				d.x = d.x + self.tree_layout[i].offset.x;
				//if (!d.parent) console.log(d.x);
				if (d.parent) {
					d.y = d.parent.y + 80 + (d.rank * (self.rect_height + 8));
				} else {
					d.y = self.tree_layout[i].offset.y;
				}
			});
			nodes.push.apply(nodes, t_nodes);
			links.push.apply(links, tree.links(t_nodes));
		}
		// data binding for nodes and links
		var node = self.svg.selectAll("g.node")
		   	 	.data(nodes, function(d) {
		   	 		// TODO: check this:
		   	 		// remap nodes here every time 
		   	 		if (d.id == null) {
		   	 			d.id = ++ self.node_count;
		   	 			self.node_mapper[[d.tree_id, d.node_id]] = d.id;
		   	 		}
		   	 		return d.id; 
		   	 	});
		
		var link = self.svg
				.selectAll("path.link")
				.data(links, function(d) {
					return d.target.id;
				});
		
		var nodeEnter = node.enter()
			.append("g")
			.attr("class", "node")
			.attr("transform", function(d) {
				// TODO: fix source 
				return "translate(" + source.x0 + "," + source.y0 + ")"; })
			.on("click", function(d) { 
				self.toggle(d);
				self.update(d);
			})
			.on("contextmenu", function(d) {
				if (!d.parent || !d._children) {
					self.showNodeOperationTooltip(d);
				}
				d3.event.preventDefault();
			})
			.on("mouseover", function(d) {
				self.path_view_helper(d);
			})
			.on("mouseout", function() {
				link.classed("active", false);
			});

		nodeEnter.append("rect")
		   .attr("x", function(d) {
			   return - self.node_box_width(d.label) / 2;
		   })
		   .attr("width", 1e-6)
		   .attr("height", 1e-6);
		  
		nodeEnter.append("text")
			.attr("y", 2)
			.attr("dy", "12px")
			.attr("text-anchor", "middle")
			.text(function(d) {
				return d.label; })
			.style("fill-opacity", 1e-6);
		
		// for every existing nodes
		var nodeUpdate = node.transition()
			.duration(self.duration)
			.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")";
			});
	 
		nodeUpdate.select("rect")
			.attr("x", function(d) {
			   return - self.node_box_width(d.label) / 2;
		   	})
			.attr("width", function(d) {
				return self.node_box_width(d.label);
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
			.attr("y", 2)
			.attr("dy", "12px")
			.attr("text-anchor", "middle")
			.text(function(d) {
			   return d.label; })
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
				return self.link_stroke_scale(d.target.samples);});
		
		self.svg.selectAll("path.link")
			.on("mouseover", function(d) {
				self.path_view_helper(d.target);
			})
			.on("mouseout", function() {
				link.classed("active", false);
			});
		
		// existing links
		link.transition()
			.duration(self.duration)
			.attr("d", self.diagonal)
			.style("stroke-width", function(d) {
				return self.link_stroke_scale(d.target.samples);});
			//.style("stroke", self.stroke_callback);
	 
		// removed links
		link.exit().transition()
			.duration(self.duration)
			.attr("d", function(d) {
				var o = {x: source.x, y: source.y};
				return self.diagonal({source: o, target: o});
			})
			.remove();
	 
		// backup locations
		nodes.forEach(function(d) {
		    d.x0 = d.x;
		    d.y0 = d.y;
		});
		self.is_collapsed = [];
		for (var i = 0; i < self.num_trees; i++) {
			self.is_collapsed.push(self.forest_data[i]._children ? true : false); 
		}
		console.log(self.is_collapsed);
	},
	path_view_helper : function(nd) {
		var self = this;
		var path = self.path_helper(nd);
		self.svg.selectAll("path.link")
			.classed("active", false);
		//link.classed("active", false);
		active_links = [];
		for (var i = 0; i + 1 < path.length; i++) {
			active_links.push({source : path[i], target : path[i+1]});
		}
		self.svg.selectAll("path.link")
			.data(active_links, function(d) {
				return d.target.id; })
			.classed("active", true);
		gtreepath.update(path);
	},
	node_box_width : function(label) {
    	var text_len = label.length * this.char_to_pxl + 15;
    	var width = d3.max([this.rect_width, text_len]);
    	return width;
    },
	showNodeOperationTooltip : function(d) {
		var self = this;
		// remove all previous tooltips
		self.tooltips.clear();
		history.tooltips.clear();
		
		var box_width = self.node_box_width(d.label);
		if (d.parent == null) {
			// show remove tree option if this is not the first tree
			var y_offset = 0;
			if (self.num_trees > 1) {
				self.tooltips.add(d.x + box_width / 2 + 2, d.y - 15, {
					op_type : "tree_remove",
					op_iter :  history.active_op_id,
					node_id : d.node_id,
					tree_id : d.tree_id,
					num_trees : self.num_trees});
				y_offset = 15;
			}
			// show expand tree option
			self.tooltips.add(d.x + box_width / 2 + 2, d.y + y_offset, {
					op_type : "tree_expand",
					op_iter :  history.active_op_id,
					node_id : d.node_id,
					tree_id : d.tree_id,
					num_trees : self.num_trees});
		} else if (d.type === "split") {
			self.tooltips.add(d.x + box_width / 2 + 2, d.y, {
				op_type : "node_remove",
				op_iter :  history.active_op_id,
				node_id : d.node_id,
				tree_id : d.tree_id,
				num_trees : self.num_trees});
		} else if (d.pos_cnt > 0 && d.neg_cnt > 0) {
			var request = {
					op_type : "node_expand",
					op_iter :  history.active_op_id,
					node_id : d.node_id,
					tree_id : d.tree_id,
					num_trees : self.num_trees
				};
			self.tooltips.add(d.x + box_width / 2 + 2, d.y, request);
		}
	}
};

/******** BACKUP CODE *******
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
 */
 