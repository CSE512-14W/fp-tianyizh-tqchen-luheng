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
	
d3.json( "data/feature.json",
         function( error, data){
             var nodes = data.nodes;
             var feature = [];
             for (var i = 0; i < nodes.length; i++) {
                 feature.push([nodes[i].feature, nodes[i].types, nodes[i].explanation]);
                 console.log(nodes[i]);
             };
             console.log(feature);
             var featuretable = new TableSort(
                "#featuretable",
                [
                    { text: 'Feature', sort: TableSort.alphabetic},
                    { text: 'Type', sort: TableSort.numeric, sort_column: true },
                    { text: 'Details', sort: TableSort.alphabetic}

                ],
                feature,
                { width: '400px', height: '500px' }
                );
         }
       );

$.get("cgi-bin/tree_manipulation.py", 
		init_request,
		function(data) {
			history.update( init_request, data );
            gtreepath.update( [data.forest[0],] );
            btrees.init( data );
		});
