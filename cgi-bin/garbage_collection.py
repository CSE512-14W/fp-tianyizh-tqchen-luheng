#!/usr/bin/python
import cgi
import cgitb
import json
import sys
import uuid

import xgboost_utils

cgitb.enable()
request = cgi.FieldStorage()

user_id = request["user_id"].value

sys.stderr.write(user_id)    