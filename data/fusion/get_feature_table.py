import json
import re
"""
def normalizeFeatureName(featname):
    s1 = featname.split("_")
    s2 = [re.findall('[A-Z][^A-Z]*', s) for s in s1]
    return "-".join(["-".join(s) for s in s2])
"""
ftable = {}
nodes = []
features = []
description = []

with open('fmap.raw.txt', 'r') as fmap_file:
    feat_id = 0
    for line in fmap_file:
        info = line.strip().split("\t")
        if len(info) < 2 or info[0].startswith("Feature"):
            continue
        
        feat_id += 1
        nodes.append( {"feature": info[0],
                       "explanation": info[1],
                       "id": feat_id,
                       "types":""} )
        #features.append(info[0])
        #description.append(info[1])

ftable["set"] = "fusion"
ftable["nodes"] = nodes
#ftable["feature"] = features
#ftable["description"] = description

#print 'Content-type: application/json\n\n' 
print json.dumps(ftable, indent=4, separators=(',', ': ')) 
