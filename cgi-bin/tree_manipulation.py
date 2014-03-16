#!/usr/bin/python

""" Testing backend communication
"""
import cgi
import cgitb
import json
import sys
import xgboost_utils

cgitb.enable()
request = cgi.FieldStorage()
# currently supported node op: node expand, node removal and tree removal


op_type = request["op_type"].value
op_iter = int(request["op_iter"].value)
num_trees = int(request["num_trees"].value)
dataset = request["dataset"].value

# initialize model
new_config = []
new_forest = None

xgboost_utils.setDataset(dataset)
    
if op_iter > 0:
    booster_id = int(request["tree_id"].value)
    node_id = int(request["node_id"].value)
    
    if op_type == "node_expand":
        new_config = [("interact:booster_index", booster_id),\
                      ("bst:interact:expand", node_id)]
        sys.stderr.write(str(new_config) + "\n")
    elif op_type == "node_remove":
        new_config = [("interact:booster_index", booster_id),
                      ("bst:interact:remove", node_id)]
    elif op_type == "tree_expand":
        new_config = [("num_round", num_trees), ]
    elif op_type == "tree_remove":
        new_config = [("interact:booster_index", booster_id),
                      ("interact:action", "remove")]
else:
    new_config = [("num_round", num_trees),
                  ("bst:max_depth", request["max_depth"].value)]
            
if op_type == "restore_op": 
    new_forest = xgboost_utils.loadModel(op_iter)
else:
    new_forest = xgboost_utils.trainNewModel(op_iter, new_config)

new_forest["op_iter"] = op_iter + 1

print 'Content-type: application/json\n\n' 
print json.dumps(new_forest)
