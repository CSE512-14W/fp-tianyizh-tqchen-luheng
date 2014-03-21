function op_tooltips(tt_class) {
	this.op_text_snippets = {
		"node_expand" : " + Expand this node",
		"node_remove" : " - Remove this node",
		"tree_expand" : " + Grow a new tree",
		"tree_remove" : " - Remove this tree",
		"restore_op" : " Restore ",
		"node_expand_all" : " + Expand this node for all",
		"node_remove_all" : " + Remove this node for all",
		"feat_ban" : " - Disallow this feature",
		"feat_ban_group" : " - Disallow this feature group",
		"feat_ban_all" : " - Disallow all features by default",
		"feat_pass" : " + Allow this feature",
		"feat_pass_group" : " + Allow this feature group",
		"feat_pass_all" : " + Allow all features by default",
	};
	this.tt_class = tt_class;
	this.tt_height = 24;
	this.char_to_pxl = 6.4;
	this.duration = 300;
	this.svg = null;
}

op_tooltips.prototype = {
	add : function(svg, source, xx, yy, request) {
		this.svg = svg;
		//console.log("add tooltip at: ", xx, yy);
	    var snippets = this.op_text_snippets;
	    var tooltip = svg.append("g")
			.attr("class", this.tt_class)
			.attr("transform", "translate(" + xx + "," + yy + ")");
	    	
	    var op_type = request.op_type;
	    var tt_label = snippets[op_type];
	    var tt_width = tt_label.length * this.char_to_pxl;
	    
	    request.dataset = main_dataset;
	    console.log(request);
	    
	    tooltip.append("rect")
			//.attr("class", "tooltip")
			.attr("rx", 2)
			.attr("ry", 2)
			.attr("width", tt_width)
			.attr("height", this.tt_height)
			.on("mouseover", function() {
				d3.select(this).classed("active", true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
			})
			.on("click", function() {
				if (request.callback) {
					request.callback();
				} else {
					if (request.op_type === "tree_expand") {
						request.max_depth = main_max_depth;
					}
					$.get("cgi-bin/request_handler.py", 
							{ request : JSON.stringify(request) },
							function(data) {
								history.update(request, data, source);
					            btrees.init(data);
					            ftable.update();
							});
				}
			});
	    	
	    tooltip.append("text")
			.text(tt_label)
			.attr("x", 5)
			.attr("y", 15)
			.attr("text-anchor", "left");
	},
	move : function(xx, yy) {
		// FIXME: not working
		this.svg.selectAll("g." + this.tt_class)
			.transition()
			.duration(this.duration)
			.attr("transform", function(d) {
				return "translate(" + xx + "," + yy + ")";
			});
	},
	clear : function() {
		if (this.svg) {
			this.svg.selectAll("g." + this.tt_class).remove();
		}
	}
};