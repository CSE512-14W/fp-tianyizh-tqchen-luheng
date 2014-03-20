#!/bin/bash
# quit previous server, if any
screen -X -S TIMLSERVER quit
cd bin
screen -dmS TIMLSERVER ./timl_server.py
cd ..
cd public
python -m CGIHTTPServer  
