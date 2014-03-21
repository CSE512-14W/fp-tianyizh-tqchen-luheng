#!/usr/bin/python
import copy
import itertools
import json
import re
import sys
import subprocess

from collections import Counter

def loadFeatureMap(fmap_path):
    feat_range = {}
    with open(fmap_path, 'r') as fmap_file:
        for line in fmap_file:
            info = line.strip().split()
            fid = int(info[0])
            fname = info[1]
            if "=" in fname:
                fname = "=".join(fname.split("=")[:-1])
            if not fname in feat_range:
                feat_range[fname] = [fid, fid + 1]
            else:
                range = feat_range[fname]
                feat_range[fname] = [range[0], fid + 1]
        fmap_file.close()
    return feat_range

def loadFeatureTable(ftable_path, fmap_path):
    feature_map = {}
    feature_range = loadFeatureMap(fmap_path)
    prefix_map = Counter()
    with open(ftable_path, 'r') as ftable_file:
        ftable = json.load(ftable_file)
        features = []
        for (fid, node) in enumerate(ftable["nodes"]):
            feature = node["feature"]
            fsplit = getFeatureSegments(feature)
            prefix_map.update([".".join(fsplit[:i]) for i in range(1, len(fsplit))])
            if not feature in feature_range:
                sys.stderr.write("unmapped featrue: " + feature + "\n")
                frange = [0, 0]
            else:
                frange = feature_range[feature]
                
            features.append( { "name" : feature,
                               "info" : node["explanation"],
                               "type" : "unk",
                               "feature_id" : fid,
                               "start" : frange[0],
                               "end" :  frange[1]
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