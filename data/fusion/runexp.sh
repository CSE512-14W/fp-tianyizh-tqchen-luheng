#!/bin/bash
# map feature using indicator encoding, also produce featmap.txt
if [ ! -f fusion.txt ]; then
    python mkdata.py 
fi
python mknfold.py fusion.txt 1
# training
#../../xgboost/xgboost fusion.conf
~/code/github/xgboost/xgboost fusion.conf
# this is what dump will looklike without feature map
~/code/github/xgboost/xgboost fusion.conf task=dump model_in=0004.model name_dump=dump.raw.txt 
# this is what dump will looklike with feature map
~/code/github/xgboost/xgboost fusion.conf task=dump model_in=0004.model fmap=featmap.txt name_dump=dump.nice.txt

cat dump.nice.txt

