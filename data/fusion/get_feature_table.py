import json

ftable = {}
features = []
description = []

with open('fmap.raw.txt', 'r') as fmap_file:
    for line in fmap_file:
        info = line.strip().split("\t")
        if len(info) < 2:
            continue
        features.append(info[0])
        description.append(info[1])

ftable["feature"] = features
ftable["description"] = description

#print 'Content-type: application/json\n\n' 
print json.dumps(ftable, indent=4, separators=(',', ': ')) 
