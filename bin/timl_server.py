#!/usr/bin/python
import SocketServer

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
import xgboost_utils
import feature_utils

def makeInt(obj):
    if isinstance(obj, list):
        return [int(o) for o in obj]
    return int(obj)

def handleReq( request ):
    op_type = request["op_type"]
    op_iter = int(request["op_iter"])
    num_trees = int(request["num_trees"])
    dataset = request["dataset"]
    
    new_config = []
    new_forest = None
    
    xgboost_utils.setDataset(dataset)
    
    user_id = request["user_id"]
    if len(user_id) == 0:
        ''' assign new user
        '''
        user_id = uuid.uuid1()
        
    if op_type == "restore_op": 
        ''' restore old model
        '''
        new_forest = xgboost_utils.loadModel(user_id, op_iter)
    elif op_type == "init":
        ''' re-train the model
        '''
        new_config = [("num_round", num_trees),
                      ("bst:max_depth", request["max_depth"])]
        ''' add feature constraints
        '''
        if "fdefault" in request and int(request["fdefault"]) < 0:
            new_config.append(("bst:fdefault", -1))
        if "fban" in request and len(request["fban"]) > 0:
                new_config.extend([("bst:fban", f) for f in request["fban"]])
        if "fpass" in request and len(request["fpass"]) > 0:
            new_config.extend([("bst:fpass", f) for f in request["fpass"]])
            
        new_forest = xgboost_utils.trainNewModel(user_id, 0, new_config)
    else:
        ''' interative mode
        '''
        booster_id = request["tree_id"]
        node_id = request["node_id"]
        
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
            bsize = len(booster_id)
            for i in range(bsize):
                new_config.extend([("batch:interact:booster_index", booster_id[i]),
                                   ("batch:bst:interact:expand", node_id[i]),
                                   ("batch:run", 1)])
        elif op_type == "node_remove_all":
            bsize = len(booster_id)
            for i in range(bsize):
                new_config.extend([("batch:interact:booster_index", booster_id[i]),
                                   ("batch:bst:interact:remove", node_id[i]),
                                   ("batch:run", 1)])
        
        new_forest = xgboost_utils.trainNewModel(user_id, op_iter, new_config)    

    new_forest["op_iter"] = op_iter + 1
    new_forest["user_id"] = str(user_id)
    return json.dumps(new_forest)

class TIMLTCPHandler(SocketServer.StreamRequestHandler):
    def handle(self):
        self.request = self.rfile.readline()
        print "{} wrote:".format(self.client_address[0])
        print self.request
        # Likewise, self.wfile is a file-like object used to write back
        # to the client
        self.wfile.write( handleReq( json.loads(self.request) ) )

if __name__ == "__main__":
    HOST, PORT = "localhost", 9911
    server = SocketServer.TCPServer((HOST, PORT), TIMLTCPHandler )
    server.serve_forever()
