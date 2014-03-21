/**
 * Hierarchical Featuer Table
 */

function feature_table(margin, width, height, tag) {
	this.width = width - margin.left - margin.right;
	this.height = height - margin.top - margin.bottom;
	this.margin = margin;
	
	this.barHeight = 20,
	this.barWidth = width * .8;
	this.barOffset = 20;
	
	this.duration = 400,
	
	this.tree_layout = d3.layout.tree()
	    	.size([0, 100]);
	
	this.diagonal = d3.svg.diagonal()
	    .projection(function(d) {
	    	return [d.y, d.x]; 
	    });

	this.node_color = function (d) {
		//return d._children ? "#3182bd" : d.children ? "lightsteelblue" : "azure";
		return d._children ? "#3182bd" : d.children ? "lightsteelblue" : "azure";
	};
	
	this.svg = d3.select(tag)
		.append("svg")
	    .attr("width", width)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	  
	d3.select(tag).style("height", height + "px");
	
	// do this only once except when dataset changes
	this.clear_constraints();
}

feature_table.prototype = {
	add_hint : function() {
		d3.selectAll(".hint").selectAll("p").remove();
		d3.select(".hint").append("p")
			.text("[Features]: Showing grouped features. Left click to toggle feature groups. Right click to allow/disallow features in subsequent interactions. Change of constraints on feature groups will be applied to its members.");
	},
	init : function(fdata) {
		var self = this;
		// convert feature data to tree data
		self.features = fdata;
		self.feature_data = { x0 : 0,
							  y0 : 0,
							  name : "Features (frequency)",
							  info : "Features",
							  constraint : self.fdefault,
							  count : 0,
							  type : "_", 
							};
		
		self.group_method = $("#fgselect").val();
		switch (self.group_method) {
		case "prefix" :
			self.makeGroups(self.prefixGroupMapper);
			break;
		case "none" :
			self.feature_data.children = self.features;
			break;
		default :
			self.makeGroups(self.identityGroupMapper);
			break;
		}
		
		self.clear();
		for(var i = 0; i < btrees.forest_data.length; i++) {
			this.feature_count_helper(btrees.forest_data[i]);
		}
		self.group_count_helper(self.feature_data);
		self.feature_constraint_helper(self.feature_data, "topdown");
		self.fban.forEach(function(d) {
			self.features[d].constraint = -1;
		});
		self.fpass.forEach(function(d) {
			self.features[d].constraint = 1;
		});
		self.feature_constraint_helper(self.feature_data, "bottomup");
		self.update(self.feature_data);
	},
	feature_count_helper : function(d) {
		if (d.feature_id) {
			ftable.features[d.feature_id].count ++;
		}
		var children = d.children ? d.children : d._children;
		if (children) {
			for (var i = 0; i < children.length; i++) {
				this.feature_count_helper(children[i]);
			}
		}
	},
	group_count_helper : function(d) {
		var children = d.children ? d.children : d._children;
		if (children) {
			for (var i = 0; i < children.length; i++) {
				d.count += this.group_count_helper(children[i]);
			}
		}
		return d.count;
	},
	feature_constraint_helper : function(d, prop) {
		// propagate constraints from d
		var children = d.children ? d.children : d._children;
		if (children) {
			var num_fban = 0, num_fpass = 0;
			for (var i = 0; i < children.length; i++) {
				if (prop === "topdown") {
					children[i].constraint = d.constraint;
					this.feature_constraint_helper(children[i], prop);
				} else {
					this.feature_constraint_helper(children[i], prop);
					if (children[i].constraint < 0) {
						num_fban ++;
					} else {
						num_fpass ++;
					}
				}
			}
			if (prop == "bottomup") {
				if (num_fban == children.length) {
					d.constraint = -1;
				} else if (num_fpass == children.length) {
					d.constraint = 1;
				}
			}
		}
	},
	clear : function() {
		this.features.forEach(function(d) {
			d.id = undefined;
			d.count = 0;
			d.constraint = 1; // 0 : none, -1 : disallow, 1 : allow
		});
		this.svg.selectAll("g.featnode").remove();
		this.node_count = 0;
	},
	clear_constraints : function() {
		this.fdefault = 1;
		this.fban = [];
		this.fpass = [];
	},
	update : function (source) {
		var self = this;
		tooltips.clear();
		
		var root = self.feature_data;
		var nodes = self.tree_layout.nodes(root);
		var current_height = nodes.length * self.barHeight + self.margin.top
							+ self.margin.bottom;
		d3.select("svg")
			.attr("height", current_height);
		d3.select("svg")
			.selectAll("g.featnode")
			.selectAll("text")
			.remove();
				
		nodes.forEach(function(d, i) {
			d.x = i * self.barHeight;
			d.y = 0;
			//d.y = d.depth <= 1 ? 0 : (d.depth - 1) * self.barOffset;
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
			.style("opacity", 0.6)
			.on("click", function(d) {
				self.toggle(d);
				self.update(d);
			})
			.on("mouseover", function(d, i) {
				d3.select(this).classed("active", true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
			})
			.on("contextmenu", function(d, i) {
				tooltips.clear();
				d3.select(this).classed("active", true);
				var y_offset = (d.constraint? 0 : - tooltips.tt_height / 2 - 2);
				if (d.constraint != -1) {
					var xx = d.y + self.barWidth / 4;
					var yy = d.x - self.barHeight / 2 + y_offset;
					tooltips.add(self.svg, d, xx, yy, {
							op_type : d.children || d._children ?
									(d.parent ? "feat_ban_group" :"feat_ban_all") :
									"feat_ban",
							callback : function() {
								d.constraint = -1;
								self.feature_constraint_helper(d, "topdown");
								self.update(d);
							}
						});
					y_offset += tooltips.tt_height + 1;
				}
				if (d.constraint != 1) {
					var xx = d.y + self.barWidth / 4;
					var yy = d.x - self.barHeight / 2 + y_offset;
					tooltips.add(self.svg, d, xx, yy, {
							op_type : d.children || d._children ?
									(d.parent ? "feat_pass_group" :"feat_pass_all") :
									"feat_pass",
							callback : function() {
								d.constraint = 1;
								self.feature_constraint_helper(d, "topdown");
								self.update(d);
							}
						});
				}
				d3.event.preventDefault();
			});

		nodeEnter.transition()
			.duration(self.duration)
			.attr("transform", function(d) {
				return "translate(" + d.y + "," + d.x + ")";
			})
			.style("opacity", 1);
		/*
		nodes.forEach(function(d) {
			console.log(d.label, "constraint: ", d.constraint, "count: ", d.count);
		});
		*/
		node.append("text")
			.attr("dy", 3.5)
			.attr("dx", 5.5)
			.text(function(d) {
				return d.parent ? d.name + " (" + d.count + ")" : d.name;
			});
		
		node.append("text")
			.attr("x", self.barWidth)
			.attr("y", 0)
			.attr("dy", 3.5)
			.attr("dx", 5.5)
			.text(function(d) {
				if (d.constraint == 0) {
					return "";
				}
				return d.constraint > 0 ? "[+]" : "[-]";
			})
			.style("font", "arial black")
			.style("font-size", "16")
			.style("font-weight", "bold");
		
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
	getFeatureFilters : function() {
		var self = this;
		if (!self.feature_data || !self.feature_data.constraint) {
			return null;
		}
		self.fdefault = self.feature_data.constraint,
		self.fpass = [],
		self.fban = [];
		
		var res = {};
		res.fdefault = self.feature_data.constraint,
		res.fpass = [],
		res.fban = [];
		
		self.features.forEach(function(d, i) {
			console.log(self.fdefault, d.constraint);
			if (d.constraint != self.fdefault) {
				if (d.constraint > 0) {
					res.fpass.push(d.start + "-" + d.end);
					self.fpass.push(i);
				} else {
					res.fban.push(d.start + "-" + d.end);
					self.fban.push(i);
				}
			}
		});
		return res;
	},
	toggle : function(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
	},
	makeGroups : function(group_mapper) {
		var self = this;
		self.groups = [];
		self.group_dict = {};
		for (var i = 0; i < self.features.length; i++) {
			var feature = self.features[i];
			var gid = group_mapper(i, self.features, self.groups,
									self.group_dict);
			if (gid < 0) {
				self.groups.push(feature);
			} else {
				self.groups[gid].children.push(feature);
			}
		}
		self.feature_data.children = self.groups;
		self.feature_data.children.forEach(self.toggle);
	},
	prefixGroupMapper : function(fid, features, groups, dict) {
		var feature = features[fid];
		if (!feature.prefix) {
			return -1;
		}
		var gname = feature.prefix;
		var gid = dict[gname];
		if (gid === undefined) {
			gid = groups.length;
			dict[gname] = gid;
			groups.push({ name : "group: " + gname,
						children : [],
						constraint : 1,
						count : 0 });
		}
		return gid;
	},
	identityGroupMapper : function(fid, features, groups, dict) {
		var feature = features[fid];
		var k = Math.floor(feature.feature_id / 20);
		var gname = "id " + (k * 20) + " - " +
					Math.min((k * 20 + 19), features.length - 1);
		//console.log(feature, k, gname);
		var gid = dict[gname];
		if (gid === undefined) {
			gid = groups.length;
			dict[gname] = gid;
			groups.push({ name : gname,
						children : [],
						constraint : 1,
						count : 0 });
		}
		return gid;
	}
};
