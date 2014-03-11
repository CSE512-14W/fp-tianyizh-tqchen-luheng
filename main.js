// this is main js that cover all up
var gtreepath = new pathgraph( { top:30, right:10, bottom:10, left:10}, 
                                500, 300, "#modelpathgraph" );
var history = new op_history( { top:30, right:150, bottom:10, left:10}, 
		 500, 300, "#historygraph");

var enable_toggle = false;
var btrees = new boosting_tree( { top:30, right:150, bottom:10, left:50}, 
        						 800, 800, "#modeltreegraph" , enable_toggle);

var init_request = {
	op_type : "init", op_iter : 0, num_trees : 0 };

$.get("cgi-bin/tree_manipulation.py", 
		init_request,
		function(data) {
			history.add( init_request );
            gtreepath.update( [data.forest[0],] );
            btrees.init( data );
		});
