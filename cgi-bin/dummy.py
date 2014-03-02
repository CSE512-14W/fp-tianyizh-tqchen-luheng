#!/usr/bin/python

""" Testing backend communication
"""

import cgi
import cgitb
import json

cgitb.enable()

request = cgi.FieldStorage()
print 'Content-type: application/json\n\n'
print json.dumps ({ "content" : "hello! " + str(request["node_id"]) })
