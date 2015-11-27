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

        function legend ( el ) { return legend.draw( this ) }
        legend.value = getset( options, "value" );
        legend.color = getset( options, "color" );
        legend.palette = getset( options, "palette" );
        legend.data = getset( options, "data" );
        legend.direction = getset( options, "direction" );
        legend.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( legend, legend.data() || data );
                draw( legend, this, data ); 
            })
            return this;
        }

        return legend;
    }

    function layout ( that, data ) {
        var data = data.map( function ( d ) {
            return { v: d[ that.value() ], c: d[ that.color() ], obj: d }
        })

        // deduplication
        return d3.nest()
            .key( function ( d ) { return d.c } )
            .entries( data )
            .map( function ( d ) { return d.values[ 0 ] } );
    }

    function draw ( that, el, data ) {
        el = d3.select( el );

        if ( el.attr( "data-color-chart" ) != "legend" ) {
            el.attr( "data-color-chart", "legend" )
                .text( "" );
        }

        var radius = 6;
        var c = color.palette()
            .colors( that.palette() )
            .domain( data.map( function ( d ) { return d.c } ) )
            .scale();

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
