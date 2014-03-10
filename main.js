// this is main js that cover all up 
var gtreepath = new pathgraph( { top:30, right:10, bottom:10, left:10}, 
                                560, 800, "#modelpathgraph" );

var enable_toggle = false;
var btrees = new boosting_tree( { top:30, right:50, bottom:10, left:50}, 
        						900, 1000, "#modeltreegraph" , enable_toggle);

$.get("cgi-bin/tree_manipulation.py", 
		{ op_type : "init", op_iter : 0, num_trees : 0 },
		function(data) {
            gtreepath.update( [data.forest[0],] );
            btrees.init( data );
		});
