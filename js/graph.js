var Graph = function(options) {
	this.nodesObj = {};
	this.nodesArray = [];
    this.isStable = true;
    this.isMinimized = false;
};

Graph.prototype = {
	addNode: function(node){
		this.nodesObj[node.getId()] = node;
        this.isStable = false;
	},

	getNodeArray: function (){
        this.stabilize();
        return this.nodesArray;
    },

    _generateNodeArray: function(){
		return $.map(this.nodesObj, function(k, v) {
            return [k];
        });
    },

    stabilize: function(forced){
        if (this.isStable && !forced) return;
        this.isStable = true;
        //generate node Array
        this.nodesArray = this._generateNodeArray();

        //generate Dijkstra library map
        var map = this.getDijkstraLibMap();
        this.dijkstra = new Dijkstra(map);
    },

    getStart: function(){
        this.stabilize();
        if (this.startNode) return this.startNode;
    	for (var i=0;i<this.nodesArray.length; i++) {
            if (this.nodesArray[i].isStart()) return this.startNode=this.nodesArray[i];
        }
    },

    getExit: function(){
        this.stabilize();
        if (this.exitNode) return this.exitNode;
        for (var i=0;i<this.nodesArray.length; i++) {
            if (this.nodesArray[i].isExit()) return this.exitNode=this.nodesArray[i];
        }
    },

    getPowerPills: function(){
        this.stabilize();
        if (this.powerPills) return this.powerPills;

        var ret=[];
        for (var i=0;i<this.nodesArray.length; i++) {
            if (this.nodesArray[i].isPowerPill()) ret.push(this.nodesArray[i]);
        }
        return this.powerPills = ret;
    },

    getEssentialNodes: function(){
        var ret=[];
        ret.push(this.getStart());
        $.merge(ret, this.getPowerPills());
        ret.push(this.getExit());
        return ret;
    },

    getNodeById:function (id){
    	return this.nodesObj[id];
    },

    findIndexById: function(Id) {
        for (var i=0;i<this.nodesArray.length; i++) {
            if (this.nodesArray[i].getId() === Id) return i;
        }
    },

    removeNode: function(Id){
        this.stabilize();
        var node = this.nodesObj[Id],
            connectedNode = node.getConnections();

        if (!node.isRemovable()) console.warn("Removing a non removable Node");


        //for (var i=0; i<connectedNode.length; i++){
		//	this.nodesObj[connectedNode[i]].removeConnection(Id);
        //}

        if (node.isLeaf()) {
        	//if the node is a leaf we can just remove it
        	this.nodesObj[connectedNode[0].to].removeConnection(Id);
        } else if (node.isLink()){
        	prevNode = this.nodesObj[connectedNode[0].to];
        	nextNode = this.nodesObj[connectedNode[1].to];

        	var prevSteps = prevNode.removeConnection(node.getId());
            prevSteps.push(node.getId());
        	prevNode.addConnection(nextNode.getId(),prevSteps);

            var nextSteps = nextNode.removeConnection(node.getId());
            nextSteps.push(node.getId())
        	nextNode.addConnection(prevNode.getId(),nextSteps);
        }

        //delete the currentNode
        delete this.nodesObj[Id];
        this.isStable = false;
    },

    removeNodeConnection: function(nodeA,nodeB) {
        nodeA.removeConnection(nodeB.getId());
        nodeB.removeConnection(nodeA.getId());
    },

    getLinksArray: function() {
        //Todo: probably slow
        var links = [],
        	self = this;
        for (var i=0;i<this.nodesArray.length; i++) {
        	$.each(this.nodesArray[i].getConnections(),function(j,connection){
				var target = self.findIndexById(connection.to);
                if (target) {
                    links.push({
                        "source":i,
                        "target":target,
                        "distance": connection.steps.length + 1
                    });
                }
        	}); 
        }
        return links;
    },

    //TODO:very slow
    reduceDeadEnd: function (){
        var node;
        while (nodeId = this.getRandomRemovableLeafId()){
            this.removeNode(nodeId);
        }
    },

    //TODO:very slow
    reduceLinks: function (){
        var node;
        while (nodeId = this.getRandomRemovableLink()){
            this.removeNode(nodeId);
        }
    },

    //TODO:very slow
    //find a leaf and kill it
    getRandomRemovableLink: function (){
        for (var nodeId in this.nodesObj) {
            if (this.nodesObj.hasOwnProperty(nodeId)) {
                var node = this.nodesObj[nodeId];
                if (node.isLink() && node.isRemovable()) {
                	return nodeId;
                }
            }
        }
        return false;
    },

    //TODO:very slow
    //find a leaf and kill it
    getRandomRemovableLeafId: function (){
        for (var nodeId in this.nodesObj) {
            if (this.nodesObj.hasOwnProperty(nodeId)) {
                var node = this.nodesObj[nodeId];
                if (node.isLeaf() && node.isRemovable()) {
            		return nodeId;
                }
            }
        }
        return false;
    },


    //Walk a labyrith with only one walkable path
    walkLinear: function() {
    	var route = [];
    	var currentStep = this.getStart();
    	var prev;
    	var next;
    	var nexts;
    	route.push(currentStep.getId());

    	while(!currentStep.isExit()){
    		nexts = currentStep.getConnections();
    		if (nexts.length>2) {
                console.warn("Cannot work linear due to this node: ", currentStep);
                return;
            } 

    		if (!prev || nexts[0].to!==prev) {
    			next = nexts[0].to;
                //route.push(nexts[0].to);
                //$.merge(route, nexts[0].steps );
    		} else {
    			next = nexts[1].to;
                //route.push(nexts[1].to);
                //$.merge(route, nexts[1].steps );
    		}

    		prev = currentStep.getId();
    		currentStep = this.getNodeById(next);

    		route.push(currentStep.getId());
    	}
        //route.push(currentStep.getId());
    	return route;
    },

    //Get the map used by the Dijkstra library
    getDijkstraLibMap:function(){
        var map = {};
        $.each(this.nodesArray,function(i,el){
            var connections = {};
            $.each(el.connections,function(i,el) {
                connections[el.to] = el.steps.length +1
            });
            map[el.getId()] = connections;
        });
        return map;
    },

    findShortestPath: function(){
        this.generateMinNodeMaze();
        this.stabilize();

        var startNode = this.getStart();
        var exitNode = this.getExit();
        var powerPills = this.getPowerPills();
        
        var rootPath = $.map(powerPills, function(el,i){return el.getId()}); //an array with all points
        var rootPathFixedPart = [];
        var possiblePaths = []; //all the combinations
        var currentSolution;
        var currentSolutionCost;
        var tempSolution;
        var tmpCost;
        var tmpArgs;
        var startNodeId = startNode.getId();
        var exitNodeId = exitNode.getId();
        
        //this solve up to chucknorris
        if (powerPills.length > 0) {
            if (powerPills.length>8) {
                console.log('Too many power pills to find optimal solution, use greedy algorithm instead');
                while(this.removeMostExpensiveConnectionOfEachNode()) ;

                currentSolution = this.walkLinear();
            } else {
                //while (rootPath.length>8) {
                //    rootPathFixedPart.push(rootPath.pop());
                //}
                possiblePaths = permute(rootPath);
                for(var i=0; i<possiblePaths.length; i++) {
                    tmpArgs = [startNodeId];
                    $.merge(tmpArgs, rootPathFixedPart);
                    $.merge(tmpArgs, possiblePaths[i]);
                    tmpArgs.push(exitNodeId);
                    tempSolution = this.dijkstra.findShortestPath(tmpArgs);
                    tmpCost = this.getPathCost(tempSolution);
                    console.log('Evaluated solution ' + i + ' of ' + possiblePaths.length +' - Length: ' + tmpCost);
                    
                    
                    if (!currentSolution) {
                        currentSolution= tempSolution;
                        currentSolutionCost = this.getPathCost(currentSolution)
                    } else if (tmpCost < currentSolutionCost) {
                        console.log("Better solution solution found")
                        currentSolution = tempSolution;
                        currentSolutionCost = tmpCost;
                    }

                    //chucknorris
                    //Solution: 153 Length: 321 undefined 
                    //if (currentSolution.length===321) return currentSolution;
                }
            }
        } else {
            currentSolution = this.dijkstra.findShortestPath([startNodeId,exitNodeId]);
        }

        //this path should reintegrate the missingBits
        return this.getFullPathFromReducedPath(currentSolution);
    },

    //
    generateMinNodeMaze:function(){
        if (this.isMinimized) return true;
            this.isMinimized = true;
        console.time("generateMinNodeMaze");
        this.stabilize();

        //take not removable nodes (start, end, pills)
        //evaluate the distance from one to the other
        //create the shortest link
        var essentialNodes = this.getEssentialNodes();
        var tmpGraph = new Graph();
        var node;
        var connections;

        //Add each node to the new graph
        //Doing in 2 steps to have the node ready for the link back
        for (var i=0; i<essentialNodes.length; i++) {
            //pushing the node without connections
            var nod = essentialNodes[i];
            tmpGraph.addNode(new Node({
                    mazeName: nod.mazeName,
                    LocationId : nod.getId(),
                    LocationType : nod.LocationType,
                    connection : [],
                    displayName: i
            }));
        }

        //Evaluate connection on nodes for the new graph
        for (var i=0; i+1<essentialNodes.length; i++) {
            for (var j=i+1; j<essentialNodes.length; j++) {
                //connection from node i to node j
                var nodeA = tmpGraph.getNodeById(essentialNodes[i].getId());
                var nodeB = tmpGraph.getNodeById(essentialNodes[j].getId());
                var connectionPath = this.dijkstra.findShortestPath(nodeA.getId(),nodeB.getId());
                
                //removing start and end
                connectionPath = _.initial(connectionPath);
                connectionPath = _.rest(connectionPath);

                nodeA.addConnection(nodeB.getId(),connectionPath)
                nodeB.addConnection(nodeA.getId(),connectionPath)

            };
        };

        //Swap with the new array
        this.nodesObj = tmpGraph.nodesObj;
        this.stabilize(true);
        console.timeEnd("generateMinNodeMaze")
    },

    //WARNING: dijkstra should exist to call this function
    getNodeDistance:function(nodeA, nodeB){
        return this.dijkstra.findShortestPath(nodeA.getId(), nodeB.getId());
    },

    getFullPathFromReducedPath: function(pathArray) {
        var shortestPath = [];
        for (var i=0; i<pathArray.length; i++) {
            var nodeId = pathArray[i];
            shortestPath.push(nodeId);
            if (i+1 < pathArray.length) { 
                var connection = this.getNodeById(nodeId).getConnectionTo(pathArray[i+1]);
                jQuery.merge( shortestPath, connection.steps )
            }
        }
        return shortestPath;
    },

    //Todo: optimize if needed
    getPathCost: function (pathArray) {
        var shortestPath = [];
        for (var i=0; i<pathArray.length; i++) {
            var nodeId = pathArray[i];
            shortestPath.push(nodeId);
            if (i+1 < pathArray.length) { 
                var connection = this.getNodeById(nodeId).getConnectionTo(pathArray[i+1]);
                jQuery.merge( shortestPath, connection.steps )
            }
        }
        return shortestPath.length;
    },

    findMostExpensiveRemovableConnection:function(node){
        var mostExpensiveConnection;
        var connections = node.getConnections();
        mostExpensiveConnection;

        if (node.isLeaf() || node.isLink()) return false;

        for (var i=0; i<connections.length; i++) {
            //check if destination node can loose a connection
            if(this.canNodeLooseConnections(this.getNodeById(connections[i].to))){
                if (!mostExpensiveConnection) {
                    mostExpensiveConnection = connections[i];
                } else if (connections[i].getCost() > mostExpensiveConnection.getCost()) {
                    mostExpensiveConnection = connections[i];
                }    
            }
        }

        return mostExpensiveConnection;
    },

    removeMostExpensiveConnection:function(node){
        var toRemove = this.findMostExpensiveRemovableConnection(node);
        if (toRemove) {
            this.removeNodeConnection(node,this.getNodeById(toRemove.to));
            return true;
        }
        return false;
    },

    removeMostExpensiveConnectionOfEachNode: function(){
        var ret = false;
        for (var i=0;i<this.nodesArray.length; i++) {
            var currNode = this.nodesArray[i];
            if(this.canNodeLooseConnections(currNode)) {
                if (this.removeMostExpensiveConnection(currNode)) {
                    ret = true;
                }
            }
        }
        return ret;
    },

    canNodeLooseConnections:function(node){
        if  ( node.isStart() || node.isExit() ) {
            if (!node.isLeaf()) return true;
           
        } else if (! node.isLink ()) {
            return true;
        }
        return false;
    },

    //Debug function
    debugInfo: function(){
        for (var i=0;i<this.nodesArray.length; i++) {
            var currNode = this.nodesArray[i];
            console.log(currNode.getConnections().length())
        }
    },

    findWalkableSolution: function(){
        var ret=[];
        var tmp;
        for (var i=0;i<this.nodesArray.length; i++) {
            tmp = this.walkLinearAB(this.nodesArray[i]);
            if (tmp) ret.push(tmp);
        }
        return ret;
    },

    //Walk a labyrith with only one walkable path
    walkLinearAB: function(A,B) {
        B = B || A;
        var route = [];
        var currentStep = A;
        var prev;
        var next;
        var nexts;
        var isStart = true;
        route.push(currentStep.getId());

        while(!(currentStep.getId() === B.getId()) || isStart){
            isStart = false;
            nexts = currentStep.getConnections();
            if (nexts.length>2) {
                return false;
            } 

            if (!prev || nexts[0].to!==prev) {
                next = nexts[0].to;
            } else {
                if (!next[1]) return;
                next = nexts[1].to;
            }

            prev = currentStep.getId();
            currentStep = this.getNodeById(next);

            route.push(currentStep.getId());
        }
        //route.push(currentStep.getId());
        return route;
    },



    solveLastLevel: function(){
        //this.generateMinNodeMaze();
        this.stabilize();

        var startNode = this.getStart();
        var exitNode = this.getExit();
        var powerPills = this.getPowerPills();
        
        var rootPath = $.map(powerPills, function(el,i){return el.getId()}); //an array with all points
        var rootPathFixedPart = [];
        var possiblePaths = []; //all the combinations
        var currentSolution;
        var currentSolutionCost;
        var tempSolution;
        var tmpCost;
        var tmpArgs;
        var startNodeId = startNode.getId();
        var exitNodeId = exitNode.getId();
        var currentSolutionI;
        
            
        //while (rootPath.length>8) {
        //    rootPathFixedPart.push(rootPath.pop());
        //}

        //tailored for last level
        //var combination = [[1],[2],[22,23,26],[24,25,27],[3,4,2,12,18,16,19,13,8,5,7,9,14,10,6],[15,11,17,20,21]]
        var combination = [[1],[2],[26,22,23],[24,25,27],[3,4,2,12,18,16,19,13,8,5,7,9,14,10,6],[15,11,17,20,21]]
        //var combination = [[1],[2],[26,22,23],[24,25,27],[3,4,2,12,18,16,19,13,8,5,7,9,14,10,6],[21,15,11,17,20]]

        var keys = [];
        $.each(combination,function(i,el){
            console.log(el,i)
            keys.push($.map(el,function(el, i){
                console.log(el,i)
                return maze.getNodeArray()[el].getId()
            }));
        });

        possiblePaths = permute(keys);
        tmpArgs = [startNodeId];
        $.merge(tmpArgs, rootPathFixedPart);
        $.merge(tmpArgs, possiblePaths[17]);
        tmpArgs.push(exitNodeId);
        tmpArgs= _.unique(_.flatten(tmpArgs));
        return tmpArgs;
        //DEBUG

        
        for(var i=0; i<possiblePaths.length; i++) {
            tmpArgs = [startNodeId];
            $.merge(tmpArgs, rootPathFixedPart);
            $.merge(tmpArgs, possiblePaths[i]);
            tmpArgs.push(exitNodeId);
            tmpArgs= _.unique(_.flatten(tmpArgs)); //Why do I need unique?
            tempSolution = this.dijkstra.findShortestPath(tmpArgs);
            tmpCost = this.getPathCost(tempSolution);
            console.log('Evaluated solution ' + i + ' of ' + possiblePaths.length +' - Length: ' + tmpCost);
            
            
            if (!currentSolution) {
                currentSolution= tempSolution;
                currentSolutionCost = this.getPathCost(currentSolution)
            } else if (tmpCost < currentSolutionCost) {
                console.log("Better solution solution found ", i)
                currentSolution = tempSolution;
                currentSolutionCost = tmpCost;
                currentSolutionI = i;
            }

            //chucknorris
            //Solution: 153 Length: 321 undefined 
            //if (currentSolution.length===321) return currentSolution;
        }

        console.log("best solution number" + currentSolutionI)
        
        //this path should reintegrate the missingBits
        return this.getFullPathFromReducedPath(currentSolution);
    },

    solveLastLevel2: function(arr){
        //this.generateMinNodeMaze();
        this.stabilize();

        var startNode = this.getStart();
        var exitNode = this.getExit();
        var powerPills = this.getPowerPills();
        
        var rootPath = $.map(powerPills, function(el,i){return el.getId()}); //an array with all points
        var rootPathFixedPart = [];
        var possiblePaths = []; //all the combinations
        var currentSolution;
        var currentSolutionCost;
        var tempSolution;
        var tmpCost;
        var tmpArgs;
        var startNodeId = startNode.getId();
        var exitNodeId = exitNode.getId();
        var currentSolutionI;
        
        currentSolution = this.dijkstra.findShortestPath(arr);
        

        console.log("current solution lengt" + currentSolution.length)
        
        //this path should reintegrate the missingBits
        return this.getFullPathFromReducedPath(currentSolution);
    },

    getIdFromIndex: function(arr){
        var self=this;
        return $.map(arr,function(el,i){
            return self.getNodeArray()[el].getId();
        })
    },

    getIndexFromId: function(arr){
        var self=this;
        return $.map(arr,function(el,i){
            return self.findIndexById(el);
        })
    }
}