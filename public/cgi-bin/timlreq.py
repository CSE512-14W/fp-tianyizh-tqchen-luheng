#!/usr/bin/python

""" backend communication
"""
import cgi
import cgitb
import imp
import json
import socket
import sys

HOST, PORT = "localhost", 9911

cgitb.enable()
rawreq = cgi.FieldStorage()["request"].value;
print rawreq

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    # Connect to server and send data
    sock.connect( (HOST, PORT) )
    sock.sendall( rawreq+'\n' )
    # Receive data from the server and shut down
    received = sock.makefile().readline()
    print 'Content-type: application/json\n\n' 
    print received
finally:
    sock.close()
