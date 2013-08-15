var Link = function(options) {
  this.to = options.to;
  this.steps = options.steps || [];
};

Link.prototype = {
	getCost: function(){
		return 1 + this.steps.length;
	}
}