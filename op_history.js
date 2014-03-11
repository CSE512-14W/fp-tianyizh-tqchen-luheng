function op_history (margin, width, height, tag) {
	this.margin = margin;
    this.width = width;
    this.height = height - margin.top - margin.bottom;
    
    //this.tag = tag;
    this.svg = d3.select(tag)
    			.append("svg")
    			.attr("width", this.width + margin.left + margin.right)
    			.attr("height", this.height + margin.top + margin.bottom )
    			.append("g")
    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    			.append("g")
    			.attr("class", "history");
   
    this.diagonal = d3.svg
    			.diagonal()
    			.projection( function(d) { return [d.x, d.y]; });
    
    this.ops = [];
	this.char_to_pxl = 5.5;
}

op_history.prototype = {
	update : function() {
		var self = this;
		var opEnter = self.svg
			.selectAll("text")
			.data(self.ops)
			.enter();
		
		opEnter.append("rect")
			//.style("width", 200)
			.attr("x", 0)
			.attr("y", function(d, i) {
				return i * 20 - 14;
			})
			.attr("width", 200)
			.attr("height", 20)
			.on("mouseover", function() {
				d3.select(this).classed("active", true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("active", false);
				//console.log(this);
			})
			.on("click", function() {
				// TODO: rollback history
			});
		
		opEnter.append("text")
			.attr("x", 10)
			.attr("y", function(d, i) {
				return i * 20;
			})
			.text(function(d) {
				return d;
			});
	},
	op_log_helper : function(request) {
		return request.op_type + " on " + request.tree_id + ", " + request.node_id;
	}
};