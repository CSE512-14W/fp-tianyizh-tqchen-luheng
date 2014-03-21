// this is main js that cover all up

var window_width = window.innerWidth;
var window_height = window.innerHeight;

var left_width = window_width * 0.15;
var middle_width = window_width * 0.60;
var right_width = window_width * 0.25;

var top_height = window_height * 0.3;
var bottom_height = window_height * 0.7;

console.log("window width", window_width);
console.log("window height", window_height);
console.log("split width", left_width, middle_width, right_width);

var gtreepath =  new pathgraph( { top:30, right:0, bottom:10, left:10}, 
								right_width, top_height,
								"#modelpathgraph" );

var history = new op_history( { top:10, right:0, bottom:10, left:10}, 
								right_width, bottom_height,
								"#historygraph");

var btrees = new boosting_tree( { top:20, right:80, bottom:10, left:10}, 
								middle_width,
								window_height * 0.8,
								"#modeltreegraph");

var ftable = new feature_table ( { top:20, right:10, bottom:10, left:10},
								left_width,
								window_height * 0.8,
								"#featuretable");

var tooltips = new op_tooltips();

var main_dataset = "";
var main_features = null;
var main_user_id = "";

var change_dataset = function() {
	// re-train everything!
	var feat_filters = null;
	var curr_dataset = $("#dataselect").val();
	console.log(curr_dataset, main_dataset);
	if (main_dataset != curr_dataset) {
		main_dataset = curr_dataset;
		ftable.clear_constraints();
	} else {
		console.log("here");
		feat_filters = ftable.getFeatureFilters();
		console.log(feat_filters.fban.length, feat_filters.fpass.length);
	}

	para = {num_trees : $("#numtreeinput").val(),
			max_depth : $("#maxdepthinput").val()};
	btrees.clear();
	history.clear();
	 
	var init_request = {
			op_type : "init",
			op_iter : 0,
			num_trees : para.num_trees,
			max_depth : para.max_depth,
			dataset : main_dataset,
			user_id : main_user_id,
		};
	 
	if (feat_filters != null) {
		init_request.fdefault = feat_filters.fdefault;
		init_request.fban = feat_filters.fban;
		init_request.fpass = feat_filters.fpass;
	}
	
	console.log(init_request);
	$.get("cgi-bin/request_handler.py", 
			{ request : JSON.stringify(init_request) },
			function(data) {
				main_features = data.features;
				main_user_id = data.user_id;
				history.update(init_request, data);
	            gtreepath.update([data.forest[0],]);
	            btrees.init(data);
	            ftable.init(main_features);
			});
			
};

var garbage_collection = function() {
	if (main_user_id.length == 0) {
		return "bye";
	}
	/*
	last_request = {user_id : main_user_id,
			  		message : "garbage collection" };
	$.get("../cgi-bin/request_handler.py", 
			{ request : JSON.stringify(last_request) },
			function (data) {
				alert(data.message);
			});
	return "bye";
	*/
};
