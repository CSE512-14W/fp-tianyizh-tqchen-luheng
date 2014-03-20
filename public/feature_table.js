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
}

feature_table.prototype = {
	init : function(fdata) {
		var self = this;
		// convert feature data to tree data
		self.features = fdata;
		self.feature_data = { x0 : 0,
							  y0 : 0,
							  name : "Features (frequency)",
							  info : "Features",
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
		self.update(self.feature_data);
	},
	update : function (source) {
		var self = this;
		var root = self.feature_data;
		var nodes = self.tree_layout.nodes(root);
		
		var current_height = nodes.length * self.barHeight + self.margin.top
							+ self.margin.bottom;
		d3.select("svg")
			.attr("height", current_height);
				
		nodes.forEach(function(d, i) {
			d.x = i * self.barHeight;
			d.y = d.depth <= 1 ? 0 : (d.depth - 1) * self.barOffset;
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
			})
			.on("mouseover", function(d, i) {
				d3.select(this).classed("active", true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
			})
			.on("contextmenu", function(d, i) {
				tooltips.clear();
				// FIXME: what happened???
				var xx = d.x;
				var yy = d.y + self.barWidth;
				tooltips.add(self.svg, d, xx, yy, {
						user_id : main_user_id,
						op_type : d.children || d._children ?
									"feat_group_ban" : "feat_ban",
						op_iter : 0,
						feat_id : d.feature_id,
						num_trees : btrees.num_trees
					});
				d3.event.preventDefault();
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
	clear : function() {
		this.features.forEach(function(d) {
			d.id = undefined;
		});
		this.svg.selectAll("g.featnode").remove();
		this.node_count = 0;
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
			groups.push({ name : "feature group: " + gname, children : [] });
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
			groups.push({ name : gname, children : [] });
		}
		return gid;
	}
};
