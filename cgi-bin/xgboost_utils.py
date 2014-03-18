#!/usr/bin/python
import copy
import json
import os
import re
import sys
import subprocess

from bson import Binary
from bson.json_util import dumps as bson_dumps

import feature_utils

DATASET_NAME = "fusion"
XGBOOST_PATH = "../xgboost/xgboost"
TRAIN_PATH = "../data/fusion/fusion.txt.train"
TEST_PATH = "../data/fusion/fusion.txt.test"
FEATMAP_PATH = "../data/fusion/featmap.txt"
FEATTABLE_PATH = "../data/fusion/features.json"
TEMP_PATH = "../temp"

DEFAULT_CONFIG = []

def setDataset(dataset):
    global DATASET_NAME
    global XGBOOST_PATH
    global TRAIN_PATH
    global TEST_PATH
    global FEATMAP_PATH
    global FEATTABLE_PATH
    global TEMP_PATH 
    global DEFAULT_CONFIG
    
    if dataset == "fusion":
        DATASET_NAME = "fusion"
        TRAIN_PATH = "./data/fusion/fusion.txt.train"
        TEST_PATH = "./data/fusion/fusion.txt.test"
        FEATMAP_PATH = "./data/fusion/featmap.txt"
        FEATTABLE_PATH = "./data/fusion/features.json"
        TEMP_PATH = "./temp"
        XGBOOST_PATH = "./xgboost/xgboost"
    elif dataset == "fusion_local":
        DATASET_NAME = "fusion"
        TRAIN_PATH = "../data/fusion/fusion.txt.train"
        TEST_PATH = "../data/fusion/fusion.txt.test"
        FEATMAP_PATH = "../data/fusion/featmap.txt"
        FEATTABLE_PATH = "../data/fusion/features.json"
        TEMP_PATH = "../temp"
        XGBOOST_PATH = "../xgboost/xgboost"
    else:
        DATASET_NAME = "mushroom"
        TRAIN_PATH = "./data/agaricus.txt.train"
        TEST_PATH = "./data/agaricus.txt.test"
        FEATMAP_PATH = "./data/featmap.txt"
        FEATTABLE_PATH = "./data/feature.json"
        TEMP_PATH = "./temp"
        XGBOOST_PATH = "./xgboost/xgboost"
        
    DEFAULT_CONFIG = [
        ("num_round" , 1),
        ("base_score", 0.5),
        ("save_period" , 0),
        ("eval_metric", "logloss"),
        ("data" , TRAIN_PATH),
        ("eval[test]" , TEST_PATH),
        ("eval[train]" , TRAIN_PATH),
        ("test:data" , TEST_PATH),
        ("booster_type" , 0),
        ("loss_type" , 2),
        ("bst:tree_maker" , 2),
        ("bst:eta" , 0.1),
        ("bst:gamma" , 1.0),
        ("bst:min_child_weight" , 1),
        ("bst:max_depth" , 2)    
    ]


def loadModel(user_id, op_iter):
    config_path = "%s/%s_%s_%04d.conf" % (TEMP_PATH,
                                          str(user_id),
                                          DATASET_NAME,
                                          op_iter)
    model_out_path = "%s/%s_%s_%04d.model" % (TEMP_PATH,
                                              str(user_id),
                                              DATASET_NAME,
                                              op_iter + 1)
    dump_path = "%s/%s_%s_%04d.dump" % (TEMP_PATH,
                                        str(user_id),
                                        DATASET_NAME,
                                        op_iter + 1)
    sys.stderr.write(dump_path + "\n")
    
    # evaluation
    proc = subprocess.Popen([XGBOOST_PATH, config_path, "task=eval",\
                    "model_in=" + model_out_path],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    evals = parseEval(proc.stderr.read())
    sys.stderr.write("eval log: " + str(evals) + "\n")
    test_error = evals['test-error']
    train_error = evals['train-error']
    
    features, feature_map = feature_utils.loadFeatureTable(FEATTABLE_PATH)
    json_obj = dump2json(dump_path, feature_map)
    json_obj['test_error'] = test_error
    json_obj['train_error'] = train_error
    if op_iter == 0:
        json_obj['features'] = features 
        
    return json_obj

def trainNewModel(user_id, op_iter, new_config):
    config_path = "%s/%s_%s_%04d.conf" % (TEMP_PATH,
                                          str(user_id),
                                          DATASET_NAME,
                                          op_iter)
    model_in_path = "%s/%s_%s_%04d.model" % (TEMP_PATH,
                                             str(user_id),
                                             DATASET_NAME,
                                             op_iter)
    model_out_path = "%s/%s_%s_%04d.model" % (TEMP_PATH,
                                              str(user_id),
                                              DATASET_NAME,
                                              op_iter + 1)
    dump_path = "%s/%s_%s_%04d.dump" % (TEMP_PATH,
                                        str(user_id),
                                        DATASET_NAME,
                                        op_iter + 1)
    
    sys.stderr.write("\n".join([config_path, model_in_path, model_out_path, dump_path]) + "\n")
    
    with open(config_path, 'w') as config_file:
        for cfg in DEFAULT_CONFIG:
            config_file.write(cfg[0] + "=" + str(cfg[1]) + "\n")
        for cfg in new_config:
            config_file.write(cfg[0] + "=" + str(cfg[1]) + "\n")
        config_file.close()
    
    subprocess.call(["cat", config_path], stdout=sys.stderr)

    if op_iter == 0:
        subprocess.call([XGBOOST_PATH, config_path,\
                        "model_out=" + model_out_path], stdout=sys.stderr)
    else:
        subprocess.call([XGBOOST_PATH, config_path, "task=interact",\
                        "model_in=" + model_in_path,\
                        "model_out=" + model_out_path], stdout=sys.stderr)
    
    # dump model and path
    subprocess.call([XGBOOST_PATH, config_path, "task=dump",\
                    "model_in=" + model_out_path, "fmap=" + FEATMAP_PATH,\
                    "name_dump=" + dump_path], stdout=sys.stderr)
    
    subprocess.call([XGBOOST_PATH, config_path, "task=dumppath",\
                    "model_in=" + model_out_path,\
                    "name_dumppath=" + dump_path + ".path"], stdout=sys.stderr)
    
    # evaluation
    proc = subprocess.Popen([XGBOOST_PATH, config_path, "task=eval",\
                    "model_in=" + model_out_path],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    evals = parseEval(proc.stderr.read())
    sys.stderr.write("eval log: " + str(evals) + "\n")
    test_error = evals['test-error']
    train_error = evals['train-error']
    
    features, feature_map = feature_utils.loadFeatureTable(FEATTABLE_PATH)
    response = dump2json(dump_path, feature_map)
    response['test_error'] = test_error
    response['train_error'] = train_error
    if op_iter == 0:
        response['features'] = features
        
    # add model binary
    """
    with open(model_out_path, "rb") as mfile:
        response["model"] = Binary(mfile.read())
        mfile.close()
    """
    return response
        
def parseEval(eval_log):
    eval_info = eval_log.strip().split()[1:]
    return dict( [ (s.split(':')[0], float(s.split(':')[1])) for s in eval_info ])

def recordStats( rec, l, label ):
    for it in l.split(','):
        k = int( it )
        if k not in rec:
            rec[ k ] = (0,0)            
        if label == 0:
            rec[k] = (rec[k][0]+1,rec[k][1])
        else:
            rec[k] = (rec[k][0],rec[k][1]+1)

def loadStats(dumppath_path):
    results = {}
    with open(TEST_PATH, 'r') as test_file:
        with open(dumppath_path) as dumppath_file:
            for line in dumppath_file:
                label = int(test_file.readline().split()[0])
                info = line.split()
                for i in xrange(len(info)):
                    if i not in results:
                        results[i] = {}
                    recordStats(results[i], info[i], label)
            dumppath_file.close() 
        test_file.close()
    return results
    
def remapNode(node_map, node_key):
    ''' deprecated
    '''
    if not node_key in node_map:
        node_map[node_key] = len(node_map)
    return node_map[node_key]

def getRecursiveTreeData(nodes, node_id, rank):
    node = nodes[node_id]
    node['rank'] = rank
    if 'children' in node:
        cids = node['children']
        children = [getRecursiveTreeData(nodes, cid, i) for (i, cid)\
                    in enumerate(cids)]
        node['children'] = children
    return node
        
def dump2json(dump_path, raw_feature_map):
    nodes = {}
    forest = []
    booster_id = 0
    
    stats = loadStats(dump_path + ".path")

    with open(dump_path, 'r') as dump_file:
        for line in dump_file:
            line = line.strip()
            if line.startswith('booster['):
                if len(nodes) > 0:
                    forest.append(getRecursiveTreeData(nodes, 0, 0))
                    nodes = {}
                booster_id = int(line.split('[')[1].split(']')[0])
            else:
                node = {}
                node_id = int(line.split(':')[0])
                node['node_id'] = node_id
                node['tree_id'] = booster_id
                
                try:
                    node['neg_cnt' ] = stats[booster_id][node_id][0]
                except KeyError:
                    node['neg_cnt' ] = 0
                try:
                    node['pos_cnt' ] = stats[booster_id][node_id][1]
                except KeyError:
                    node['pos_cnt' ] = 0
                    
                node['samples'] = node['pos_cnt'] + node['neg_cnt']
                
                idx = line.find('[')
                if idx != -1:   
                    node['label'] = line[idx+1:].split(']')[0]
                    
                    # binary tree!
                    node['children'] = [int(c.split('=')[1]) for c in\
                                        line.split()[1].split(',')][:2]
                                        
                    node['edge_tags'] = [c.split('=')[0] for c in\
                                        line.split()[1].split(',')][:2]
                    
                    node['type'] = 'split'
                    
                    raw_feature = re.split('[=><]+', node['label'])[0]
                    #sys.stderr.write(node['label'] + ", " + raw_feature + "\n")
                    node['feature_id'] = raw_feature_map[raw_feature]
                else:
                    label = line.split(':')[1].strip()
                    label_info = label.split('=')
                    node['label'] = label_info[0]
                    node['weight'] = float(label_info[1])
                    node['type'] = 'leaf'
                
                nodes[node_id] = node
    
        # prepare json data for visualization, substitute children ids to children
        #nodes.sort(key = lambda x:x['id'] )
        forest.append(getRecursiveTreeData(nodes, 0, 0))
        dump_file.close()
    
    
    json_obj = { "forest" : forest }
    #sys.stderr.write(json.dumps(json_obj, indent=4, separators=(',', ': ')) + "\n")
    return json_obj
    

if __name__ == "__main__":
    # test
    setDataset("fusion_local")
    forest = trainNewModel("aaa", 0, [])
    print forest
    
    forest = loadModel("aaa", 0)
    print forest
