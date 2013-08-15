var Node = function(options) {
    this.labyrinthUrl = options.labyrinthUrl || "http://labyrinth.lbi.co.uk";
    this.mazeUrl = options.mazeUrl || "/Maze/Location";
    this.mazeName = options.mazeName || "easy";

    this.id = options.LocationId;
    if (options.Exits) {
    	this.connections = this._parseConnections(options.Exits);
    } else {
    	this.connections = []
    }
	
    this.LocationType = options.LocationType;

};

Node.prototype = {
	getConnections: function(){
		return this.connections;
	},

	removeConnection:function (id) {
		var connectionIndex = -1,
			ret
		$.each(this.connections,function(i, el){
			if (el.to===id) {
				connectionIndex = i,
				connection = el
			}
		});
		if (connectionIndex !== -1) {
			this.connections.splice( connectionIndex, 1 );
			return (connection.steps);
		}
		return false;
	},

	getConnectionTo: function(id){
		var connectionIndex = -1,
			ret
		$.each(this.connections,function(i, el){
			if (el.to===id) {
				connectionIndex = i,
				connection = el
			}
		});
		if (connectionIndex !== -1) {
			return connection
		}
		return false;
	},

	addConnection:function (id, steps) {
		this.connections.push(new Link({
				to:id,
				steps:steps
			})
		);
	},

	getId: function(){
		return this.id;
	},

	getLocationType: function(){
		return this.LocationType;
	},

	isStart:function (){
		return this.LocationType==='Start';
	},

	isExit:function (){
		return this.LocationType==='Exit';
	},

	isPowerPill:function (){
		return this.LocationType==='PowerPill';
	},

	isRemovable:function(){
		if (this.isExit() || this.isStart() || this.isPowerPill()) return false;
		if (this.isLeaf() || this.isReduceable()) return true;
		return false;
	},

	isReduceable:function(){
		if (this.isExit() || this.isStart() || this.isPowerPill()) return false;
		if (this.isLink()) return true;
		return false;
	},

	isLeaf:function(){
		return this.connections.length===1;
	},

	isLink:function(){
		return this.connections.length===2;
	},

	_parseConnections:function (connectionsUrls) {
		var ret = [],
			self = this;

		$.each(connectionsUrls, function (i,el){
			//converting url to id
			var id = self.getIdFromUrl(el)
			
			var link = new Link({
				to:id
			});
			ret.push(link);
		});
		return ret;
	},

	getIdFromUrl: function(url) {
        return url.replace(this.mazeUrl + '/' + this.mazeName + '/','');
    },

    getLinkCost: function () {
    	return 5;
    },

    getNodeColor:function () {
        if (this.LocationType === "Start") return "green";
        if (this.LocationType === "Exit") return "red";
    	if (this.LocationType === "PowerPill") return "white";
        if (this.LocationType === "Normal") return "gray";
        return 4;
    },

    getNodeSize:function () {
        if (this.LocationType === "Start" || this.LocationType === "Exit") {
            return 10;
        }
        if (this.LocationType === "PowerPill" ) {
        	return 5;
        }
        return 2;
    }
}