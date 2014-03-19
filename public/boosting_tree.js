/**
 * boosting tree visualizer 
 */

function boosting_tree (margin, width, height, tag) {
	this.margin = margin;
    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;
    
    this.svg = d3.select(tag)
    			.append("svg")
    			.attr("width", width)
    			.attr("height", height)
    			.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
   
    this.tooltips = new op_tooltips(this.svg);
    this.diagonal = d3.svg
    			.diagonal()
    			.projection( function(d) {
    				return [d.x, d.y];
    			});
    
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
	    this.used_features = {};
	    this.tree_layout = [];
	    this.is_collapsed = [];
	    this.num_trees = 0;
	},
	init : function(tdata) {
		var self = this;
		self.forest_data = tdata.forest;
		self.forest = [];
		
		var tree_delta = self.forest_data.length - self.num_trees;
		self.num_trees = self.forest_data.length;
		
		/**
		 * auto collapsing
		 */
		for (var i = 0; i < self.num_trees; i++) {
			// only use node_id of last time ..
			var tree = self.forest_data[i];
			self.node_id_helper(tree);
			// tree.label = "tree[" + i + "] : " + tree.label; 
		}

		if (tree_delta <= 0) {
			for (var i = 0; i < self.num_trees; i++) {
				if (i < self.is_collapsed.length && self.is_collapsed[i]) {
					self.toggle(self.forest_data[i]);
				} 
			}
		} else if (tree_delta == 1) {
			/* growing a new tree, show last tree */
			self.auto_collapsing(self.num_trees - 1, true);
		} else if (tree_delta > 1) {
			/* show first tree at initialization */
			self.auto_collapsing(0, true);
		}
		
		/**
		 * handle features
		 */
		self.used_features = [];
		for (var i = 0; i < main_features.length; i++) {
			self.used_features.push(false);
		}
		
		self.first_root = self.forest_data[0];
		self.num_samples = self.first_root.samples;
		
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
	node_label_helper : function(node) {
		if (!node.parent) {
			return "tree[" + node.tree_id + "] " + node.label;
		}
		if (node.type === "leaf") {
			return "w=" + node.weight.toFixed(3);
		}
		return node.label;
	},
	node_color_helper : function(node) {
		// TODO : color encoding
	},
	toggle : function (d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
			return false;
		} else {
			d.children = d._children;
			d._children = null;
			return true;
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
		var vertical = (self.width < 800);
		var tree_width = vertical ? self.width - 200 : self.width - 400;
		
		var width = function(d) {
			// TODO: estimate width smarter
			return d.children ? tree_width : 100;
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
		var leftbar_width = 300;
		var last_x = vertical ? 0 : leftbar_width;
		var last_y = vertical ? 300 : -50;
		var offset_x = 0, offset_y = 0;
		var t_width = 0, t_height = 0;
		
		for (var i = 0; i < self.num_trees; i++) {
			var root = self.forest_data[i];
			if (root._children) {
				offset_x = leftbar_width / 4;
				offset_y = last_y + 50;
				last_y = offset_y;
			} else {
				t_width = width(root);
				t_height = height(root);
				offset_x = last_x + self.tree_margin;
				offset_y = 0;
				last_x = offset_x + t_width;
			}
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

		/**
		 * process all the trees
		 */
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
				d.x = d.x + self.tree_layout[i].offset.x;
				if (d.parent) {
					d.y = d.parent.y + 80 + (d.rank * (self.rect_height + 8));
				} else {
					d.y = self.tree_layout[i].offset.y;
				}
				d.show_label = self.node_label_helper(d);
			});
			nodes.push.apply(nodes, t_nodes);
			links.push.apply(links, tree.links(t_nodes));
			
			// update features
			t_nodes.forEach(function(d) {
				if (d.feature_id) {
					self.used_features[d.feature_id] = true;
				}
			});
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
				var is_expanded = self.toggle(d);
				if (!d.parent && is_expanded) {
					self.auto_collapsing(d.tree_id, is_expanded);
				}
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
			   return - self.node_box_width(d.show_label) / 2;
		   })
		   .attr("width", 1e-6)
		   .attr("height", 1e-6);
		  
		nodeEnter.append("text")
			.attr("y", 2)
			.attr("dy", "12px")
			.attr("text-anchor", "middle")
			.text(function(d) {
				return d.show_label; })
			.style("fill-opacity", 1e-6);
		
		// for every existing nodes
		var nodeUpdate = node.transition()
			.duration(self.duration)
			.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")";
			});
	 
		nodeUpdate.select("rect")
			.attr("x", function(d) {
			   return - self.node_box_width(d.show_label) / 2;
		   	})
			.attr("width", function(d) {
				return self.node_box_width(d.show_label);
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
			   return d.show_label;
			 })
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
				return self.link_stroke_scale(d.target.samples);
			});
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
	},
	auto_collapsing : function(tree_id, is_expanded) {
		// collapse everthing else other than the node nd
		var self = this;
		var prev_id = (tree_id > 0 ? tree_id - 1 : tree_id + 1);
		// console.log(prev_id, self.num_trees, is_expanded);
		for (var i = 0; i < self.forest_data.length; i++) {
			var tree = self.forest_data[i];
			if (is_expanded && i != tree_id && tree.children) {
				self.toggle(tree);
			} else if (!is_expanded && prev_id < self.num_trees
					&& self.forest_data[prev_id]._children) {
				self.toggle(self.forest_data[prev_id]);
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
	path_view_helper : function(nd) {
		var self = this;
		var path = self.path_helper(nd);
		self.svg.selectAll("path.link")
			.classed("active", false);
	
		active_links = [];
		for (var i = 0; i + 1 < path.length; i++) {
			active_links.push({source : path[i], target : path[i+1]});
		}
		self.svg.selectAll("path.link")
			.data(active_links, function(d) {
				return d.target.id;
			})
			.classed("active", true);
		gtreepath.update(path);
	},
	path_matcher : function(path) {
		var self = this;
		var node_ids = [],
			tree_ids = [];
		for (var t = 0; t < self.forest_data.length; t++) {
			var curr_node = self.forest_data[t];
			for(var i = 0; i < path.length; i++) {
				if (curr_node.label !== path[i].label) {
					break;
				}
				if (i == path.length - 1) {
					node_ids.push(curr_node.node_id);
					tree_ids.push(curr_node.tree_id);
				} else if (curr_node.type === "split") {
					for (var j = 0; j < curr_node.edge_tags.length; j++) {
						if (curr_node.edge_tags[j] ===
							path[i].edge_tags[path[i+1].rank]) {
							curr_node = curr_node.children ?
									curr_node.children[j] :
									curr_node._children[j];
							break;
						}
					}
				} else {
					break;
				}
			}
		}
		return {node_ids : node_ids,
				tree_ids : tree_ids};
	},
	node_box_width : function(label) {
    	var text_len = label.length * this.char_to_pxl + 15;
    	var width = d3.max([this.rect_width, text_len]);
    	return width;
    },
	showNodeOperationTooltip : function(d) {
		var self = this;
		var tooltip_offset = 15;
		// remove all previous tooltips
		self.tooltips.clear();
		history.tooltips.clear();
		
		var box_width = self.node_box_width(d.label);
		var path = self.path_helper(d);
		console.log("path", path);
		var matched = self.path_matcher(path);
		console.log(matched);
		
		if (d.parent == null) {
			// show remove tree option if this is not the first tree
			var y_offset = 0;
			if (self.num_trees > 1) {
				self.tooltips.add(d.x + box_width / 2 + 2, d.y - tooltip_offset, {
					user_id : main_user_id,
					op_type : "tree_remove",
					op_iter :  history.active_op_id,
					node_id : d.node_id,
					tree_id : d.tree_id,
					num_trees : self.num_trees
				});
				y_offset = tooltip_offset;
			}
			// show expand tree option
			self.tooltips.add(d.x + box_width / 2 + 2, d.y + y_offset, {
					user_id : main_user_id,
					op_type : "tree_expand",
					op_iter :  history.active_op_id,
					node_id : d.node_id,
					tree_id : d.tree_id,
					num_trees : self.num_trees + 1
				});
		} else if (d.type === "split") {
			self.tooltips.add(d.x + box_width / 2 + 2, d.y - tooltip_offset,  {
					user_id : main_user_id,
					op_type : "node_remove",
					op_iter :  history.active_op_id,
					node_id : d.node_id,
					tree_id : d.tree_id,
					num_trees : self.num_trees
				});
			self.tooltips.add(d.x + box_width / 2 + 2, d.y + tooltip_offset, {
					user_id : main_user_id,
					op_type : "node_remove_all",
					op_iter :  history.active_op_id,
					node_id : matched.node_ids,
					tree_id : matched.tree_ids,
					num_trees : self.num_trees
				});
		} else if (d.pos_cnt > 0 && d.neg_cnt > 0) {
			self.tooltips.add(d.x + box_width / 2 + 2, d.y - tooltip_offset, {
				user_id : main_user_id,
				op_type : "node_expand",
				op_iter :  history.active_op_id,
				node_id : d.node_id,
				tree_id : d.tree_id,
				num_trees : self.num_trees
			});
			self.tooltips.add(d.x + box_width / 2 + 2, d.y + tooltip_offset, {
				user_id : main_user_id,
				op_type : "node_expand_all",
				op_iter :  history.active_op_id,
				node_id : matched.node_ids,
				tree_id : matched.tree_ids,
				num_trees : self.num_trees
			});
		}
	}
};

 