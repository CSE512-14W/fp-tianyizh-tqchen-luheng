// class to show a path in the tree
function pathgraph( margin, width, height, tag ){
    this.margin = margin;
    this.width = width - margin.left - margin.right;
    this.legendwidth = this.width / 2.5;
    this.height = height - margin.top - margin.bottom;
    this.barHeight = 30;
    this.x = d3.scale.linear()
        .range([0, this.width - this.legendwidth]);

    this.svg = d3.select( tag ).append( "svg" )
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom )
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        
    this.bar = this.svg.selectAll('.bar');
    this.legend = this.svg.selectAll( '.legend' );
    this.textleft = null;
    this.textright = null;

    this.svg.append('text')
        .attr( "text-anchor", "start" )
        .attr( "x", 10 )
        .attr( "y", -10 )
        .attr( "dy", ".35em" )
        .text( "negative count" );

    this.svg.append('text')
        .attr( "text-anchor", "end" )
        .attr( "x", this.width - this.legendwidth - 10 )
        .attr( "y", -10 )
        .attr( "dy", ".35em" )
        .text( "positive count" );
}

pathgraph.prototype = {
    update: function( data ){
        this.legend = this.legend.data([]);
        this.legend.exit().remove();
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
        var barHeight = this.barHeight;

        x.domain( [ -xMax, xMax ] );                

        // paint legend
        legend = legend.enter();
        legend.append( "g" )
            .append("text")
            .attr( "class", "pathgraph text" )
            .attr( "text-anchor", "start" )
            .attr( "x", 3 + this.width - this.legendwidth )
            .attr( "y", function(d,i) { return i*(barHeight+2) + barHeight / 2; } )
            .attr( "dy", ".35em" )
            .text( function(d,i){ 
                if( i == 0 ) return "root";
                else{
                    if( data[i-1].children[0] === data[i].id ){
                        return data[i-1].label+":yes";
                    }else{
                        return data[i-1].label+":no";
                    }
                }
            } );
        
        bar = bar.enter();
        bar.append( "rect" )
            .attr( "class", "pathgraph bar right" )
            .attr( "x", x(0) )
            .attr( "y", function(d,i) { return i * (barHeight+2); } )
            .attr( "width", function(d) { return x( d.pos_cnt ) - x( 0 );  } )
            .attr( "height", barHeight );
        
        bar.append( "rect" )
            .attr( "class", "pathgraph bar left" )
            .attr( "x", function(d){ return x( -d.neg_cnt ); } )
            .attr( "y", function(d,i) { return i*(barHeight+2); } )
            .attr( "width", function(d) { return x( d.neg_cnt ) - x( 0 );  } )
            .attr( "height", barHeight );

        this.textleft = bar.append( "text" )
            .attr( "class", "pathgraph text" )
            .attr( "text-anchor", "start" )
            .attr( "x", function(d){ return x( d.pos_cnt ) + 3; } )
            .attr( "y", function(d,i) { return i*(barHeight+2)+ barHeight / 2; } )
            .attr( "dy", ".35em" )
            .text( function(d){ return d.pos_cnt; } );

        this.textright = bar.append( "text" )
            .attr( "class", "pathgraph text" )
            .attr( "text-anchor", "end" )
            .attr( "x", function(d) { return  x( -d.neg_cnt ) - 3; } )
            .attr( "y", function(d,i) { return i*(barHeight+2) + barHeight / 2; } )
            .attr( "dy", ".35em" )
            .text( function(d){ return d.neg_cnt; } );

    }  
};
