#!/usr/bin/python

""" backend communication
"""
import cgi
import cgitb
import imp
import json
import os
import sys
import uuid

from bson.json_util import dumps as bson_dumps

#sys.path.append(os.path.dirname(__file__) + '../../bin/xgboost_utils.py')
#import xgboost_utils
xgboost_utils = imp.load_source('xgboost_utils',
                                os.path.join(os.path.dirname(__file__),
                                             '../../bin/xgboost_utils.py'))

def makeInt(obj):
    if isinstance(obj, list):
        return [int(o) for o in obj]
    return int(obj)


cgitb.enable()
request = json.loads(cgi.FieldStorage()["request"].value)
sys.stderr.write(str(request) + "\n")
op_type = request["op_type"]
op_iter = int(request["op_iter"])
num_trees = int(request["num_trees"])
dataset = request["dataset"]

new_config = []
new_forest = None

xgboost_utils.setDataset(dataset)
    
if op_iter > 0:
    
    booster_id = makeInt(request["tree_id"])
    node_id = makeInt(request["node_id"])
    user_id = request["user_id"]
    
    if op_type == "node_expand":
        new_config = [("interact:booster_index", booster_id),\
                      ("bst:interact:expand", node_id)]
    elif op_type == "node_remove":
        new_config = [("interact:booster_index", booster_id),
                      ("bst:interact:remove", node_id)]
    elif op_type == "tree_expand":
        new_config = [("num_round", num_trees), ]
    elif op_type == "tree_remove":
        new_config = [("interact:booster_index", booster_id),
                      ("interact:action", "remove")]
    elif op_type == "node_expand_all":
        new_config = [("interact:booster_index", booster_id),\
                      ("bst:interact:expand", node_id)]
    elif op_type == "node_remove_all":
        new_config = [("interact:booster_index", booster_id),\
                      ("bst:interact:expand", node_id)]
else:
    # assign new user
    user_id = uuid.uuid1()
    new_config = [("num_round", num_trees),
                  ("bst:max_depth", request["max_depth"])]
            
if op_type == "restore_op": 
    new_forest = xgboost_utils.loadModel(user_id, op_iter)
else:
    new_forest = xgboost_utils.trainNewModel(user_id, op_iter, new_config)

new_forest["op_iter"] = op_iter + 1
new_forest["user_id"] = str(user_id)

print 'Content-type: application/json\n\n' 
print bson_dumps(new_forest)
