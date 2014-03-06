#!/usr/bin/python
import os
import sys
import subprocess

DATASET_NAME = "mushroom"
XGBOOST_PATH = "../xgboost/xgboost"
TRAIN_PATH = "./cgi-bin/agaricus.txt.train"
TEST_PATH = "./cgi-bin/agaricus.txt.test"
FEATMAP_PATH = "./cgi-bin/featmap.txt"

DEFAULT_CONFIG = [
    ("num_round" , 1),
    ("save_period" , 0),
    ("data" , TRAIN_PATH),
    ("eval[test]" , TEST_PATH),
    ("test,data" , TEST_PATH),
    ("booster_type" , 0),
    ("loss_type" , 2),
    ("bst:tree_maker" , 2),
    ("bst:eta" , 1.0),
    ("bst:gamma" , 1.0),
    ("bst:min_child_weight" , 1),
    ("bst:max_depth" , 3)    
]
        
def trainNewModel(iter, new_config):
    #sys.stderr.write(os.getcwd() + "\n")
    config_path = "%s_%04d.conf" % (DATASET_NAME, iter)
    model_in_path = "%s_%04d.model" % (DATASET_NAME, iter)
    model_out_path = "%s_%04d.model" % (DATASET_NAME, iter + 1)
    dump_path = "%s_%04d.dump.txt" % (DATASET_NAME, iter + 1)
    
    sys.stderr.write("\n".join([config_path, model_in_path, model_out_path, dump_path]) + "\n")
    
    with open(config_path, 'w') as config_file:
        for cfg in DEFAULT_CONFIG:
            config_file.write(cfg[0] + "=" + str(cfg[1]) + "\n")
        for cfg in new_config:
            config_file.write(cfg[0] + "=" + str(cfg[1]) + "\n")
        config_file.close()
    
    if iter == 0:
        subprocess.call([XGBOOST_PATH, config_path,\
                        "model_in=" + model_out_path], stdout=sys.stderr)
    else:
        subprocess.call([XGBOOST_PATH, config_path, "task=interact",\
                        "model_in=" + model_in_path,\
                        "model_out=" + model_out_path], stdout=sys.stderr)
    # dump model
    subprocess.call([XGBOOST_PATH, config_path, "task=dump",\
                    "model_in=" + model_out_path, "fmap=" + FEATMAP_PATH,\
                    "name_dump=" + dump_path], stdout=sys.stderr)
    
    return dump2json(dump_path)

def dump2json(dump_path):
    roots = []
    nodes = []
    weights = []
    root_id = 0
    featmap = {}
    """
    with open(FEATMAP_PATH, 'r') as featmap_file:
        for line in featmap_file:
            info = line.split()
            featmap[int(info[0])] = info[1].strip()
        featmap_file.close()
    """
    with open(dump_path, 'r') as dump_file:
        for line in dump_file:
            line = line.strip()
            if line.startswith('booster['):
                booster_id = int(line.split('[')[1].split(']')[0])
                root_id = len(nodes)
                roots.append(root_id)
                weights.append(1.0)
            else:
                node = {}
                local_node_id = int(line.split(':')[0] )
                node['id'] = root_id + local_node_id
                node['bst_id'] = booster_id
                node['loc_id'] = local_node_id
                #node['neg_cnt' ] = stat[booster_id][local_node_id][0]
                #node['pos_cnt' ] = stat[booster_id][local_node_id][0]
                node['neg_cnt'] = 50
                node['pos_cnt'] = 50
                
                idx = line.find('[')
                if idx != -1:   
                    node['label'] = line[idx+1:].split(']')[0]
                    node['children'] = [root_id + int(c.split('=')[1])\
                                        for c in line.split()[1].split(',')]
                    node['edge_tags'] = ['yes','no']
                else:
                    node['label'] = line.split(':')[1].strip()
                    node['value'] = float(line.split(':')[1].split('=')[1])
                    
                nodes.append(node)
                
        nodes.sort(key = lambda x:x['id'] )
        dump_file.close()
    
    return { "nodes" : nodes, "roots" : roots, "weights" : weights}
    
        
   
if __name__ == "__main__":
    # test
    forest = trainNewModel(0, [])
    print forest
    