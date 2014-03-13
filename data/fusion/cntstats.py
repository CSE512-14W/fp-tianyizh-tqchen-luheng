#!/usr/bin/python
import sys

if len(sys.argv) < 2:
    print 'Usage:<filename>'
    exit(0)
pos = 0
neg = 0
for l in open( sys.argv[1] ):
    y = int( l.split()[0] )
    if y == 1:
        pos += 1 
    else:
        assert y== 0 
        neg += 1

print 'pos=%d, neg=%d, bias=%f' % (pos, neg, float(pos)/(pos+neg))
    

