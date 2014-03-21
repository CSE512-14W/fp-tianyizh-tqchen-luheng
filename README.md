##Transparent Boosting: An Interactive Machine Learning Framework
========
Tianyi Zhou, Tianqi Chen, Luheng He {tianyizh,tqchen,luheng}@uw.edu

* Tianyi leads the project report, presentation.
* Tianqi leads machine learning backend support.
* Luheng leads the implementation of interaction interface.
* All the team members are involved in discussion, and development of ideas:)

## How to run the demo
The demo can run in linux or mac machines, first make make sure system requirements are met
* g++: we need g++ to compile backend machine learning algorithms
* screen: used for creating backend request handling server 
* python: used for backend script

Make sure the machine is connected to the internet, run: 
./install.sh

If the system requirements are met the script will do everything, and you can open browser in localhost:8000 to use the demo.

## Restart demo
If you exit the cgi server, e.g. ctrl+c, use ./startserver.sh to start it. 
However, there is a chance that you need to wait less a a minute to run ./startserver.sh after you exit it.
This is due to the fact that when local tcp server exits and, the local port used by mlserver need sometime to be released.

