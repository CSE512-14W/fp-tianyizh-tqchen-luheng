#!/usr/bin/python
import copy
import json
import os
import sys
import subprocess

DATASET_NAME = "mushroom"

XGBOOST_PATH = "../xgboost/xgboost"
TRAIN_PATH = "./data/agaricus.txt.train"
TEST_PATH = "./data/agaricus.txt.test"
FEATMAP_PATH = "./data/featmap.txt"
TEMP_PATH = "./temp"
"""
XGBOOST_PATH = "../../xgboost/xgboost"
TRAIN_PATH = "../data/agaricus.txt.train"
TEST_PATH = "../data/agaricus.txt.test"
FEATMAP_PATH = "../data/featmap.txt"
TEMP_PATH = "../temp"
"""
DEFAULT_CONFIG = [
    ("num_round" , 1),
    ("save_period" , 0),
    ("data" , TRAIN_PATH),
    ("eval[test]" , TEST_PATH),
    ("test:data" , TEST_PATH),
    ("booster_type" , 0),
    ("loss_type" , 2),
    ("bst:tree_maker" , 2),
    ("bst:eta" , 1.0),
    ("bst:gamma" , 1.0),
    ("bst:min_child_weight" , 1),
    ("bst:max_depth" , 3)    
]
        
def trainNewModel(op_iter, new_config):
    #sys.stderr.write(os.getcwd() + "\n")
    config_path = "%s/%s_%04d.conf" % (TEMP_PATH, DATASET_NAME, op_iter)
    model_in_path = "%s/%s_%04d.model" % (TEMP_PATH, DATASET_NAME, op_iter)
    model_out_path = "%s/%s_%04d.model" % (TEMP_PATH, DATASET_NAME, op_iter + 1)
    dump_path = "%s/%s_%04d.dump" % (TEMP_PATH, DATASET_NAME, op_iter + 1)
    
    sys.stderr.write("\n".join([config_path, model_in_path, model_out_path, dump_path]) + "\n")
    
    with open(config_path, 'w') as config_file:
        for cfg in DEFAULT_CONFIG:
            config_file.write(cfg[0] + "=" + str(cfg[1]) + "\n")
        for cfg in new_config:
            config_file.write(cfg[0] + "=" + str(cfg[1]) + "\n")
        config_file.close()
    
    if iter == 0:
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
    
    return dump2json(dump_path)

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
        
def dump2json(dump_path):
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
                node['neg_cnt' ] = stats[booster_id][node_id][0]
                node['pos_cnt' ] = stats[booster_id][node_id][1]
                node['samples'] = node['pos_cnt'] + node['neg_cnt']
                
                idx = line.find('[')
                if idx != -1:   
                    node['label'] = line[idx+1:].split(']')[0]
                    node['children'] = [int(c.split('=')[1]) for c in\
                                        line.split()[1].split(',')]
                    node['edge_tags'] = ['yes','no']
                    node['type'] = 'split'
                else:
                    label = line.split(':')[1].strip()
                    node['label'] = label
                    node['weight'] = float(label.split('=')[1])
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
    forest = trainNewModel(0, [])
    print forest
    
