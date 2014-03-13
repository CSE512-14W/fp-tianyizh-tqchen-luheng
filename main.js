// this is main js that cover all up

var gtreepath =  new pathgraph( { top:30, right:0, bottom:10, left:20}, 
								500, 200, "#modelpathgraph" );

var history = new op_history( { top:10, right:0, bottom:10, left:20}, 
								500, 300, "#historygraph");

var btrees = new boosting_tree( { top:30, right:50, bottom:10, left:10}, 
								1200, 800, "#modeltreegraph" , false);

var main_dataset = "";
var main_features = null;

var change_dataset = function() {
	main_dataset = $("#dataselect").val();
	btrees.clear();
	history.clear();
	console.log(main_dataset);
	var init_request = {
			op_type : "init",
			op_iter : 0, num_trees : 0,
			dataset : main_dataset 
		};
	
	$.get("cgi-bin/tree_manipulation.py", 
			init_request,
			function(data) {
				main_features = data.features;
				history.update( init_request, data );
	            gtreepath.update( [data.forest[0],] );
	            btrees.init( data );
	            new TableSort( "#featuretable",
	            		[ { text: 'Features', sort: TableSort.alphabetic}, ],
	                    main_features, { width: '200', height: '800' }
	            );
			});
};

/*
$.get("cgi-bin/tree_manipulation.py", 
		init_request,
		function(data) {
			history.update( init_request, data );
            gtreepath.update( [data.forest[0],] );
            btrees.init( data );
            
            features = [];
            for (var i = 0; i < data.nodes.length; i++) {
            	features.push([data.nodes[i].feature, ]);
            }
            new TableSort( "#featuretable",
            		[ { text: 'Features', sort: TableSort.alphabetic}, ],
                    data.features, { width: '200', height: '800' }
            );
         
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
			
		});
*/