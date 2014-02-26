// this is main js that cover all up 
var gtreepath = new pathgraph( { top:30, right:10, bottom:10, left:10}, 
                               400, 500, "#modelpathgraph" );

// tree-view, fake data 
data1 = [
    {"id":0, "pos_cnt":100, "neg_cnt":100, "cond":"isgreen?", "left":1, "right":3 },
    {"id":1, "pos_cnt":40, "neg_cnt":30, "cond":"isred?", "left":4, "right":2 },
    {"id":2, "pos_cnt":30, "neg_cnt":2, "cond":"leaf", "left":-1, "right":-1 }
]; 

data2 = [
    {"id":0, "pos_cnt":100, "neg_cnt":100, "cond":"isgreen?", "left":1, "right":3 },
    {"id":3, "pos_cnt":20, "neg_cnt":40, "cond":"ishot?", "left":5, "right":6 },
    {"id":6, "pos_cnt":2, "neg_cnt":20, "cond":"haha?", "left":10, "right":11 },
    {"id":11, "pos_cnt":0, "neg_cnt":10, "cond":"leaf", "left":-1, "right":-1 }
]; 

gtreepath.update( data1 );

d3.selectAll("#test_select")
    .on( "change", function (){
        if( this.value === "Data1" ){
            gtreepath.update( data1 );
        }else{
            gtreepath.update( data2 );
        }
    });
