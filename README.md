##Transparent Boosting: An Interactive Machine Learning Framework
========
Tianyi Zhou, Tianqi Chen, Luheng He {tianyizh,tqchen,luheng}@uw.edu

* Tianyi leads the project report, presentation, and develop parts of featureview module.
* Tianqi leads machine learning backend server support, and develops the pathview module.
* Luheng leads the implementation of interaction interface, and communication with backend.
* All the team members are involved in discussion, and development of ideas:)

## Project Summary Page:
http://cse512-14w.github.io/fp-tianyizh-tqchen-luheng/

## Development Process
* Start with toy dataset from UCI machine learning repository for prototyping our project.
* Use static data exported from the machine learning tool for front-end development, such as visualization of tree and path.
* For the next step, we implemented frontend-backend communication to enable user interaction and instant feedback of the machine learning algorithm.
* From exploration with the current tool, we decided to add more powerful features such as feature selection (both groups and single features) and generalized tree modification. 

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

