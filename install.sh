#!/bin/bash
echo "install transparent boosting package"
if [ ! -d xgboost ]; then
    echo "cloning xgboost package from https://github.com/tqchen/xgboost.git"
    git clone https://github.com/tqchen/xgboost.git
fi
echo "make xgboost "
cd xgboost;make;cd ..
if [ ! -d temp ]; then
    echo "create temp directory"
    mkdir temp
fi
rm -rf temp/*

echo "start server, visit localhost:8000 in browser"
./startserver.sh


