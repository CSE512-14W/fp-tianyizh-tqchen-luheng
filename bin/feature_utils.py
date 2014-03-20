#!/usr/bin/python
import copy
import itertools
import json
import re
import sys
import subprocess

from collections import Counter

def loadFeatureTable(ftable_path):
    feature_map = {}
    prefix_map = Counter()
    with open(ftable_path, 'r') as ftable_file:
        ftable = json.load(ftable_file)
        features = []
        for (fid, node) in enumerate(ftable["nodes"]):
            feature = node["feature"]
            fsplit = getFeatureSegments(feature)
            prefix_map.update([".".join(fsplit[:i]) for i in range(1, len(fsplit))])
            features.append( { "name" : feature,
                               "info" : node["explanation"],
                               "type" : "unk",
                               "feature_id" : fid
                            } )
            feature_map[feature] = fid
        ftable_file.close()
        
    for feature in features:
        fsplit = getFeatureSegments(feature["name"])
        fprefix = ""
        for i in range(len(fsplit) - 1, 0, -1):
            pref = ".".join(fsplit[:i])
            if prefix_map[pref] > 1:
                fprefix = pref
                break;
        feature["prefix"] = fprefix
    return features, feature_map

def getFeatureSegments(feature):
    s1 = re.split("[-_]+", feature)
    fsplit = []
    for s in s1:
        s2 = re.findall('[A-Z][^A-Z]*', s)
        if len(s2) == 0:
            fsplit.append(s)
        else:
            fsplit.extend(s2)
    return fsplit