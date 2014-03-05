#!/usr/bin/python

""" Testing backend communication
"""

import cgi
import cgitb
import json

def nodeIdMapper(node_id):
    ''' todo: map global node id to local node id
    '''
    tree_id = 0
    local_node_id = 0
    return (tree_id, local_node_id)


######### MAIN STARTS HERE ##########

cgitb.enable()
request = cgi.FieldStorage()
# currently supported node op: node expand, node removal and tree removal
op_type = request["op_type"].value
node_id = int(request["node_id"].value)
(tree_id, local_node_id) = nodeIdMapper(node_id)
print 'Content-type: application/json\n\n'
#print json.dumps ({ "content" : "hello! " + str(request["node_id"]) })
print json.dumps ({ "content" : "doing operation " + op_type + " with node: " + str(node_id) })

