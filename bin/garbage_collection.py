#!/usr/bin/python
import cgi
import cgitb
import json
import sys
import uuid

from bson.json_util import dumps as bson_dumps

cgitb.enable()
request = json.loads(cgi.FieldStorage()["request"].value)


sys.stderr.write(request)    

print 'Content-type: application/json\n\n' 
print bson_dumps( { "message" : "bye-bye" } )
