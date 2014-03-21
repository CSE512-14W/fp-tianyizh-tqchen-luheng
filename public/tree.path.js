// class to show a path in the tree
function pathgraph( margin, width, height, tag ){
	
    this.margin = margin;
    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;
    this.legendwidth = this.width / 2.5;
    
    this.barHeight = 24;
    this.x = d3.scale.linear()
        .range([0, this.width - this.legendwidth]);

    this.svg = d3.select(tag)
    	.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    this.bar = this.svg.selectAll('.bar');
    this.legend = this.svg.selectAll( '.legend' );
    this.textleft = null;
    this.textright = null;
}

pathgraph.prototype = {
	add_hint : function() {
		console.log("add hint for tree path");
		d3.selectAll(".hint").selectAll("p").remove();
		d3.select(".hint").append("p")
			.text("[Paths]: Showing number positive and negative samples associated with each node on the selected path. This is an indication of feature quality.");
	},
    update: function( data ){
        this.legend = this.legend.data([]);
        this.legend
        	.exit()
        	.remove();
        
        this.svg.selectAll('text').remove();
        console.log(data);
        
        var legend = this.legend = this.legend.data( data );    
        // initialize variables     
        // bit dirty here.. don't know other ways to repaint text
        if( this.textleft != null ) {
            this.textleft.data([]).exit().remove();
        } 
        if( this.textright != null ) {
            this.textright.data([]).exit().remove();
        } 
        var bar = this.svg.selectAll('.bar');
        bar.data( [] ).exit().remove();
        this.bar = bar = this.svg.selectAll('.bar').data( data );
        
        var x = this.x;
        var xMax = data[ 0 ].pos_cnt + data[0].neg_cnt;
        var xMax_right = data[0].pos_cnt;
        var barHeight = this.barHeight;

        x.domain( [ -xMax, xMax ] );                

        var y_offset = 20;
        // paint label
        this.svg.append('text')
            .attr( "text-anchor", "end" )
            .attr( "x", x(0) -10 )
            .attr( "y", -10 )
            .attr( "dy", ".35em" )
            .text( "Negative Count" );
            //.style("opacity", 0.8);

        this.svg.append('text')
            .attr( "text-anchor", "start" )
            .attr( "x", x(0) +10)
            .attr( "y", -10 )
            .attr( "dy", ".35em" )
            .text( "Positive Count" );
            //.style("opacity", 0.8);
        
        // paint legend
        legend = legend.enter();
        legend.append( "g" )
            .append("text")
            .attr( "class", "pathgraph text" )
            .attr( "text-anchor", "start" )
            .attr( "x", x ( xMax_right ) + 50 )
            .attr( "y", function(d,i) { return i*(barHeight+2) + barHeight / 2 + y_offset; } )
            .attr( "dy", ".35em" )
            .text( function(d,i){
                if( i == 0 ) return "root";
                else{
                	var label = data[i-1].label;
                	return label + " ? " + data[i-1].edge_tags[data[i].rank];
                }
            } );
        
        bar = bar.enter();
        bar.append( "rect" )
            .attr( "class", "pathgraph bar right" )
            .attr( "x", x(0) )
            .attr( "y", function(d,i) { return i * (barHeight+2) + y_offset; } )
            .attr( "width", function(d) { return x( d.pos_cnt ) - x( 0 );  } )
            .attr( "height", barHeight );
        
        bar.append( "rect" )
            .attr( "class", "pathgraph bar left" )
            .attr( "x", function(d){ return x( -d.neg_cnt ); } )
            .attr( "y", function(d,i) { return i*(barHeight+2) + y_offset; } )
            .attr( "width", function(d) { return x( d.neg_cnt ) - x( 0 );  } )
            .attr( "height", barHeight );

        this.textleft = bar.append( "text" )
            .attr( "class", "pathgraph text" )
            .attr( "text-anchor", "start" )
            .attr( "x", function(d){ return x( d.pos_cnt ) + 3; } )
            .attr( "y", function(d,i) { return i*(barHeight+2)+ barHeight / 2 + y_offset; } )
            .attr( "dy", ".35em" )
            .text( function(d){ return d.pos_cnt; } );

        this.textright = bar.append( "text" )
            .attr( "class", "pathgraph text" )
            .attr( "text-anchor", "end" )
            .attr( "x", function(d) { return  x( -d.neg_cnt ) - 3; } )
            .attr( "y", function(d,i) { return i*(barHeight+2) + barHeight / 2 + y_offset; } )
            .attr( "dy", ".35em" )
            .text( function(d){ return d.neg_cnt; } );

    }  
};
