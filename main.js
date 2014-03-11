// this is main js that cover all up 
var gtreepath = new pathgraph( { top:30, right:10, bottom:10, left:10}, 
                                560, 800, "#modelpathgraph" );

var enable_toggle = false;
var btrees = new boosting_tree( { top:30, right:50, bottom:10, left:50}, 
        						900, 1000, "#modeltreegraph" , enable_toggle);

//feature.push(["aaa", 1]);
d3.json( "data/feature.json",
         function( error, data){
             var nodes = data.nodes;
             var feature = [];
             for (var i = 0; i < nodes.length; i++) {
                 feature.push([nodes[i].feature, nodes[i].types, nodes[i].explanation]);
                 console.log(nodes[i]);
                 //feature.push(["dasd", 2]);
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

d3.json( "data/mushroom.json",
         function( error, data ){
             var nodes = data.nodes;
             var path = [];
             path.push( nodes[0] );
             path.push( nodes[1] );              
             path.push( nodes[4] );
             path.push( nodes[6] );
             gtreepath.update( path );
             btrees.init( data );
         }
       );
         

 