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

# initialize model
new_config = []

if op_iter > 0:
    booster_id = int(request["bst_id"].value)
    local_node_id = int(request["loc_id"].value)
    node_id = int(request["node_id"].value)
    
    if op_type == "node_expand":
        new_config = [("interact:booster_index", booster_id), ("bst:interact:expand", node_id)]
        sys.stderr.write(str(new_config) + "\n")
    elif op_type == "node_remove":
        new_config = [("interact:booster_index", booster_id), ("bst:interact:remove", node_id)]
    elif op_type == "tree_expand":
    # how to encode tree operation ?
    # TODO: change this
        new_config = [("interact:booster_index", booster_id), ("bst:interact:expand", node_id)]
    elif op_type == "tree_remove":
        new_config = [("interact:booster_index", booster_id), ("bst:interact:remove", node_id)]


new_forest = xgboost_utils.trainNewModel(op_iter, new_config)

print 'Content-type: application/json\n\n' 
print json.dumps(new_forest)
