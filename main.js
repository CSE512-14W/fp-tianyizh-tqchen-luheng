// this is main js that cover all up 
var gtreepath = new pathgraph( { top:30, right:10, bottom:10, left:10}, 
                                600, 1000, "#modelpathgraph" );

var btrees = new boosting_tree( { top:30, right:50, bottom:10, left:50}, 
        						1000, 1000, "#modeltreegraph" );

d3.json( "data/mushroom.json",
         function( error, data ){
             var nodes = data.nodes;
             var path = [];
             path.push( nodes[0] );
             path.push( nodes[1] );              
             path.push( nodes[4] );
             path.push( nodes[6] );
             gtreepath.update( path )
         }
       );
         
btrees.mock_init();
