// this is main js that cover all up
var gtreepath = new pathgraph( { top:30, right:10, bottom:10, left:10}, 
                                500, 200, "#modelpathgraph" );
var history = new op_history( { top:10, right:10, bottom:10, left:10}, 
		 500, 300, "#historygraph");

var enable_toggle = false;
var btrees = new boosting_tree( { top:30, right:50, bottom:10, left:10}, 
        						 1000, 800, "#modeltreegraph" , enable_toggle);

var init_request = {
	op_type : "init", op_iter : 0, num_trees : 0 };
	
d3.json( "data/fusion/features.json",
         function(error, data){
			var features = [];
			for (var i = 0; i < data.feature.length; i++) {
				features.push([data.feature[i],]);
			}
            new TableSort( "#featuretable",
                [ { text: 'Features', sort: TableSort.alphabetic},
                //    { text: 'Description', sort: TableSort.numeric, sort_column: true },
                //    { text: 'Details', sort: TableSort.alphabetic}
                ],
                features, { width: '200', height: '800' } );
         }
       );

$.get("cgi-bin/tree_manipulation.py", 
		init_request,
		function(data) {
			history.update( init_request, data );
            gtreepath.update( [data.forest[0],] );
            btrees.init( data );
		});
