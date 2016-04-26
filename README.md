# Learning Machine Architecture Simulator (LMAS)
This is (will be) an implementation of two educational computer architectures. The first is [TOY](http://introcs.cs.princeton.edu/java/62toy/) while the second is [LMC](http://povinelli.eece.mu.edu/teaching/eece2710/lmc.html#The%20Little%20Man%20Assembly%20Language).

## Why another implementation?
There are several of these available, but by putting both in one easy find and (hopefully) use location, the hope is that people will find it easier to gain a fundamental understanding of how computer architectures work. Plus, it's just fun to implement these sorts of things!

## Installation
clone and start a weberver of your choice with the public directory as the root web directory; e.g: 
```bash
cd $project_dir/public; python -m SimpleHTTPServer
```


## Running tests
[Jasmine](http://jasmine.github.io/) is the test tool we are using for the project. Simply open the test runner thusly (assuming port 8000 is local instance):
http://localhost:8000/tests[/index.html]

### autotests
add a suitable reload plugin (e.g. [LivePage for Chrome](https://chrome.google.com/webstore/detail/livepage/pilnojpmdoofaelbinaeodfpjheijkbh?hl=en)) and the tests will run automatically when changed. 

### adding new tests
add dependencies and spec files to index.html as needed. 
