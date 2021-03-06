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
    			.attr("transform",
    				"translate(" + margin.left + "," + margin.top + ")");
    			
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
    
    this.leftbar_width = 250;

    this.stroke_callback = "#ccc";
    this.duration = d3.event && d3.event.altKey ? 5000 : 500;
    
    this.clear();
}

boosting_tree.prototype = {
	add_hint : function() {
		d3.selectAll(".hint").selectAll("p").remove();
		d3.select(".hint").append("p")
			.text("[Trees]: Showing boosting trees. Left click to toggle nodes. Right click to see possible interations. Mouseover nodes and pathes to see purity histogram.");
	},
	clear : function() {
		this.node_count = 0;
	    this.node_mapper = {};
	    this.tree_layout = [];
	    this.expanded = [-1, -1];
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
		}

		if (tree_delta < 0) {
			self.expanded = [-1, -1];
			self.auto_collapsing(self.num_trees - 1, true);
			if (self.num_trees > 1) {
				self.auto_collapsing(self.num_trees - 2, true);
			}
		} else if (tree_delta == 0) {
			/* number of trees didnot change */
			self.auto_collapsing(-1, false);
		} else if (tree_delta == 1) {
			/* growing a new tree, show last tree */
			self.auto_collapsing(self.num_trees - 1, true);
		} else if (tree_delta > 1) {
			/* show first tree at initialization */
			self.auto_collapsing(0, true);
			self.auto_collapsing(1, true);
		}
		
		/**
		 * handle features
		 */	
		self.first_root = self.forest_data[0];
		self.num_samples = self.first_root.samples;
		
		self.link_stroke_scale = d3.scale.linear()
				.domain([0, self.num_samples])
				.range([self.min_link_width, self.max_link_width]);
		
		console.log("active op id: ", history.active_op_id);
		
		if (history.timeTravaled()) {
			self.update(history.sources[history.active_op_id ]);
		}
		else if (history.active_op_id > 1) {
			self.update(history.sources[history.active_op_id - 1]);
		} else {
			self.first_root.x0 = 0;
			self.first_root.y0 = 0;
			self.update(self.first_root);
			//self.update(self.first_root);
		}
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
		var tree_width = self.width / 2;
		
		var width = function(d) {
			// TODO: estimate width smarter
			return d.children ? tree_width : 100;
		};
		var height = function(d) {
			return 800;
		};
		
		var offset_x = 0, offset_y = 0;
		var t_width = 0, t_height = 0;
		
		var num_collapsed = 0;
		var num_align = (self.width < 800 ? 2 : 4);
		self.forest_data.forEach(function(d) {
			if (d._children) {
				num_collapsed += 1;
			}
		});
		var top_bar_height = 50 * Math.ceil((num_collapsed + 1) / num_align);
		var curr_collapsed = 0;
		//var last_x = 0;
		for (var i = 0; i < self.num_trees; i++) {
			var root = self.forest_data[i];
			if (root._children) {
				// if is collapsed
				var gx = curr_collapsed % num_align;
				var gy = (curr_collapsed - gx) / num_align;
				curr_collapsed ++;
				offset_x = self.width / num_align * gx + 160;
				offset_y = 50 * gy;
				//last_y = offset_y;
			} else {
				// if is expanded
				if (i == self.expanded[0]) {
					offset_x = self.tree_margin;
				} else {
					offset_x =  self.tree_margin + tree_width;
				}
				offset_y = top_bar_height;
				t_width = width(root);
				t_height = height(root);
				//offset_x = last_x + self.tree_margin;
				//last_x = offset_x + t_width;
			}
			layout.push( { width : t_width, height : t_height,
				offset : { x : offset_x, y : offset_y} } );
		}
		
		// for new tree tooltip
		var gx = num_collapsed % num_align;
		var gy = (num_collapsed - gx) / num_align;
		var xx = self.width / num_align * gx + 100;
		var yy = 50 * gy;
		var last_root = self.forest_data[self.num_trees - 1];
		/*if (nt_tooltips.svg) {
			nt_tooltips.move(xx, yy);
		} else {*/
		nt_tooltips.clear();
		console.log("num_trees", self.num_trees);
		console.log("nt tt", gx, gy);
		nt_tooltips.add(self.svg, last_root, xx, yy,
			self.getNodeOperationRequest(last_root, "tree_expand"));
	
		return layout;
	},
	update : function(source) {
		var self = this;
			
		// remove tooltips
		tooltips.clear();
		var nodes = [],
			links = [];
		
		// compute tree layout info
		self.tree_layout = self.tree_layout_helper();

		/**
		 * process all the trees
		 */
		var is_collapsed_root = function(d) {
			return !d.parent && !d.children;
		};
		for (var i = 0; i < self.num_trees; i++) {
			var tree = d3.layout.tree()
				.size([self.tree_layout[i].width,
				       self.tree_layout[i].height]);
			var tree_data = self.forest_data[i];
			var t_nodes = tree.nodes(tree_data);
			
			dep_hist = [];
			t_nodes.forEach(function(d) {
				// computing absolute node position
				if (is_collapsed_root(d)) {
					d.x = 0;
				} 
				d.x += self.tree_layout[i].offset.x; 
				if (d.parent) {
					d.y = d.parent.y + 60 + d.rank * (self.rect_height + 4);
				} else {
					d.y += self.tree_layout[i].offset.y;
				}
				d.show_label = self.node_label_helper(d);
			});
			nodes.push.apply(nodes, t_nodes);
			links.push.apply(links, tree.links(t_nodes));
		}
		/*
		nodes.forEach(function(d) {
			console.log(d.show_label, d.x, d.y);
		});
		*/
		// data binding for nodes and links
		var node = self.svg.selectAll("g.node")
		   	 	.data(nodes, function(d) {
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
				return "translate(" + source.x0 + "," + source.y0 + ")";
			})
			.on("click", function(d) { 
				var is_expanded = self.toggle(d);
				if (!d.parent && is_expanded) {
					self.auto_collapsing(d.tree_id, is_expanded);
				}
				self.update(d);
			})
			.on("contextmenu", function(d) {
				//if (!d.parent || !d._children) {
				self.showNodeOperationTooltip(d);
				//}
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
				return d.type === "split" ? "steelblue" : "olivedrab";
			})
			.style("fill", function(d) {
				if (d.type === "leaf") {
					return d.weight > 0 ? "steelblue" : "brown";
				}
				return d._children ? "lightsteelblue" : "#fff";
			})
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

		var nodeExit = node.exit().transition()
			.duration(self.duration)
			.attr("transform", function(d) {
				return "translate(" + source.x + "," + source.y + ")";
			})
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
				return self.link_stroke_scale(d.target.samples);
			});
		
		self.svg.selectAll("path.link")
			.on("mouseover", function(d) {
				self.path_view_helper(d.target);
			})
			.on("mouseout", function() {
				link.classed("active", false);
			});
		
		link.transition()
			.duration(self.duration)
			.attr("d", self.diagonal)
			.style("stroke-width", function(d) {
				return self.link_stroke_scale(d.target.samples);
			});
			//.style("stroke", self.stroke_callback);
	 
		link.exit().transition()
			.duration(self.duration)
			.attr("d", function(d) {
				var o = {x: source.x, y: source.y};
				return self.diagonal({source: o, target: o});
			})
			.remove();

		nodes.forEach(function(d) {
		    d.x0 = d.x;
		    d.y0 = d.y;
		});
	},
	auto_collapsing : function(tree_id, is_expanded) {
		var self = this;
		if (tree_id != -1 && is_expanded) {
			if (self.expanded[1] != -1) {
				if (self.expanded[0] != -1) {
					self.toggle(self.forest_data[self.expanded[0]]);
				}
				self.expanded[0] = self.expanded[1];
			}
			self.expanded[1] = tree_id;
			if (self.expanded[0] == -1) {
				self.expanded[0] = self.expanded[1];
				self.expanded[1] = -1;
			}
		} else if (tree_id != -1) {
			if (tree_id == self.expanded[0]) {
				self.expanded[0] = -1;
			} else if (tree_id == self.expanded[1]) {
				self.expanded[1] = -1;
			}
		}
		console.log(self.expanded);
		for (var i = self.num_trees - 1; i >= 0; i--) {
			var tree = self.forest_data[i];
			if (i == self.expanded[0] || i == self.expanded[1]) {
				if (tree._children) {
					self.toggle(tree);
				}
			} else if (tree.children) {
				self.toggle(tree);
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
    getNodeOperationRequest : function(d, op_type) {
    	var request = {
			user_id : main_user_id,
			op_type : op_type,
			op_iter :  history.active_op_id,
			node_id : d.node_id,
			tree_id : d.tree_id,
			num_trees : this.num_trees,
		};
    	if (op_type === "tree_expand") {
    		request.num_trees = this.num_trees + 1;
    		request.max_depth = main_max_depth;
    	}
    	var feat_filters = ftable.getFeatureFilters();
    	if (feat_filters != null) {
    		request.fdefault = feat_filters.fdefault;
    		request.fban = feat_filters.fban;
    		request.fpass = feat_filters.fpass;
    	}
    	return request;
    },
	showNodeOperationTooltip : function(d) {
		var self = this;
		var tooltip_offset = 15;
		var box_width = self.node_box_width(d.show_label);
		var path = self.path_helper(d);
		var matched = self.path_matcher(path);
		
		tooltips.clear();
		if (d.parent == null) {
			//var y_offset = 0;
			if (self.num_trees > 1) {
				tooltips.add(self.svg, d,
						d.x0 + box_width / 2 + 2,
						d.y0, 
						self.getNodeOperationRequest(d, "tree_remove")
				);
				//y_offset = tooltip_offset;
			}
			/*
			tooltips.add(self.svg, d,
					d.x0 + box_width / 2 + 2,
					d.y0 + y_offset,
					self.getNodeOperationRequest(d, "tree_expand"));
			*/
		} else if (d.type === "split") {
			tooltips.add(self.svg, d,
					d.x0 + box_width / 2 + 2,
					d.y0 - tooltip_offset, 
					self.getNodeOperationRequest(d, "node_remove")
			);
			var request = self.getNodeOperationRequest(d, "node_remove_all");
			request.node_id = matched.node_ids;
			request.tree_id = matched.tree_ids;
			tooltips.add(self.svg, d,
					d.x0 + box_width / 2 + 2,
					d.y0 + tooltip_offset, request
			);
		} else if (d.pos_cnt > 0 && d.neg_cnt > 0) {
			tooltips.add(self.svg, d,
					d.x0 + box_width / 2 + 2,
					d.y0 - tooltip_offset, 
					self.getNodeOperationRequest(d, "node_expand")
			);
			var request = self.getNodeOperationRequest(d, "node_expand_all");
			request.node_id = matched.node_ids;
			request.tree_id = matched.tree_ids;
			tooltips.add(self.svg, d,
					d.x0 + box_width / 2 + 2,
					d.y0 + tooltip_offset, request
			);
		}
	}
};

 