function draw (selector, graph, links, displayNodeNames) {
    var width = 1200,
        height = 600;

        displayNodeNames=false;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);

    var svg = d3.select(selector).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('id','maze-graph')

      force
          .nodes(graph)
          .links(links)
          .start();

      var link = svg.selectAll(".link")
          .data(links)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke-width", function(d) { return d.distance; });

      var node = svg.selectAll(".node")
          .data(graph)
        .enter().append('g')
          .attr("class", "node")
          .call(force.drag);

      node.append("circle")
          .attr("r", function(d) {return d.getNodeSize(); })
          .attr("x", -8)
          .attr("y", -8)
          .style("fill", function(d) {return d.getNodeColor(); })

      if (displayNodeNames) {
        node.append("text")
          .attr("dx", 12)
          .attr("dy", ".55em")
          .text(function(d) { return d.getId(); })
          .style('color','black');
      }
      

      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        
        //node.attr("cx", function(d) { return d.x; })
        //    .attr("cy", function(d) { return d.y; });
      });
}