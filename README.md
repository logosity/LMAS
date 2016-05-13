# Learning Machine Emulation Project (LMAS)
This is (will be) an implementation of two educational computer architectures. The first is [TOY](http://introcs.cs.princeton.edu/java/62toy/) while the second is [LMC](http://povinelli.eece.mu.edu/teaching/eece2710/lmc.html#The%20Little%20Man%20Assembly%20Language).

## Why another implementation?
There are several of these available, but by putting both in one easy to find and (hopefully) use location, the hope is that people will find it easier to gain a fundamental understanding of how computer architectures work. Plus, it's just fun to implement these sorts of things!

## Installation
Clone the project, then start a weberver of your choice with the public directory as the root web directory; e.g: 
```bash
cd $project_dir/public; python -m SimpleHTTPServer
```

## Running tests
[Jasmine](http://jasmine.github.io/) is the test tool we are using for the project. Simply open the test runner thusly (assuming port 8000 is local instance):
```html
http://localhost:8000/tests[/index.html]
```

### Autotests
Add a suitable reload plugin (e.g. [LiveReload for Chrome](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en)) and the tests will run automatically when changed. 

(to use livereload with the python webserver above, install the appropriate module, e.g.: 'pip install livereload') and run it in the same directory as the web server.)

### Adding new tests
Add dependencies and spec files to index.html as needed. 

## (re)generating the grammar
The assembly language grammar file is in pegjs format. There is a script in the project bin/ directory to regenerate it (requires the command line tool pegjs be installed, which is a node tool. So install, node as per your platform. Personally, I like using nvm to set it up, then follow the instrucitons on the pegjs site)

To have it regen with every change, add a file watcher (e.g. I use entr: 'ls -F -d grammar/* | entr bin/update-grammar')

## Editor
To make the editor full screen type SHIFT-CTRL-F while the editor has focus.





