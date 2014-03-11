function op_tooltips(svg) {
	this.svg = svg;
	this.op_text_snippets = {
		"node_expand" : " + Expand this node",
		"node_remove" : " - Remove this node",
		"tree_expand" : " + Grow a new tree",
		"tree_remove" : " - Remove this tree",
		"restore_op" : "- Restore history"	
	};
}

op_tooltips.prototype = {
	add : function(xx, yy, request) {
	    var svg = this.svg;
	    var snippets = this.op_text_snippets;
	    var tooltip = svg.append("g")
			.attr("class", "tooltip")
			.attr("transform", "translate(" + xx + "," + yy + ")");
	    	
	    tooltip.append("rect")
			.attr("class", "tooltip")
			.attr("rx", 2)
			.attr("ry", 2)
			.attr("width", 120)
			.attr("height", 24)
			.on("mouseover", function() {
				d3.select(this).classed("active", true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
			})
			.on("click", function() {
				$.get("cgi-bin/tree_manipulation.py", request,
						function(data) {
							history.update(request, data);
				            btrees.init(data);
						});
			});
	    	
	    var op_type = request.op_type;
	    tooltip.append("text")
			.text(snippets[op_type])
			.attr("x", 5)
			.attr("y", 15)
			.attr("text-anchor", "left");
	},
	clear : function() {
		this.svg.selectAll("g.tooltip").remove();
	}
};