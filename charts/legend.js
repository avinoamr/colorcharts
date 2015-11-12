(function () {
    var color = window.color;
    var getset = color.getset;
    
    var HORIZONTAL = "horizontal";
    var VERTICAL = "vertical";

    color.legend = function ( el ) {
        var options = {
            value: null,
            color: null,
            palette: window.color.palettes.default,
            data: null,
            direction: HORIZONTAL
        }

        function legend ( el ) { return legend.draw( el ) }
        legend.value = getset( options, "value" );
        legend.color = getset( options, "color" );
        legend.palette = getset( options, "palette" );
        legend.data = getset( options, "data" );
        legend.direction = getset( options, "direction" );
        legend.draw = function ( el ) {
            draw( this, el );
            return this;
        }

        return legend;
    }

    function draw ( that, el ) {

        if ( !el.node() ) {
            return; // no parent
        }

        // read the data, either from the legend or the element
        var data = that.data() || el.datum();

        // extract the values for each obj
        var radius = 6;
        var data = data.map( function ( d ) {
            return { v: d[ that.value() ], c: d[ that.color() ], obj: d }
        })

        // deduplication
        data = d3.nest()
            .key( function ( d ) { return d.c } )
            .entries( data )
            .map( function ( d ) { return d.values[ 0 ] } );

        var palette = that.palette();
        var allc = data.map( function ( d ) { return d.c } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ palette.from, palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( palette )

        var c = palette.from && palette.to ? clin : cord;

        // start drawing
        var groups = el.selectAll( "g[data-legend-group]" )
        groups = groups.data( data )
        groups.exit().remove();
        groups.enter().append( "g" )
            .attr( "data-legend-group", function ( d ) { 
                return d.v;
            });

        // we have to process each legend separately in order to compute the 
        // width used by each group before using it to compute the x-coordinate
        // of the next group
        var direction = that.direction();
        var x = 0, y = 0;
        groups.transition().each( function ( d ) {
            var group = d3.select( this )
                .attr( "transform", function () {
                    return "translate(" + x + "," + y + ")";
                });

            var circle = group.selectAll( "circle" )
                .data( [ d ] );
            circle.enter().append( "circle" )
                .attr( "fill", c( d.c ) );
            circle
                .attr( "cx", radius )
                .attr( "cy", radius )
                .attr( "r", radius )
                .attr( "fill", c( d.c ) );

            var label = group.selectAll( "text" )
                .data( [ d ] );
            label.enter().append( "text" );
            label
                .text( d.v )
                .attr( "y", radius )
                .attr( "x", radius * 2 + 4 )
                .attr( "alignment-baseline", "middle" )
                .attr( "fill", "white" );

            x += direction == HORIZONTAL 
                ? label.node().offsetWidth + radius * 3 + 4
                : 0;

            y += direction == VERTICAL
                ? label.node().offsetHeight + radius + 4
                : 0;
        })
    }

})();
