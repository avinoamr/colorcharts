(function () {
    var color = window.color;
    var getset = color.getset;

    color.pie = function () {
        var options = {
            height: color.available( "height" ),
            width: color.available( "width" ),
            value: null,
            color: null,
            palette: window.color.palettes.default,
            data: null,
            legend: color.legend()
                .color( "key" )
                .value( "key" )
                .direction( "vertical" )
        }

        function pie () { return pie.draw( this ) }
        pie.height = getset( options, "height" );
        pie.width = getset( options, "width" );
        pie.value = getset( options, "value" );
        pie.color = getset( options, "color" );
        pie.palette = getset( options, "palette" );
        pie.data = getset( options, "data" );
        pie.legend = getset( options, "legend" );
        pie.draw = function ( selection ) {
            var chart = this;
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                draw( chart, this ) 
            })
            return this;
        }

        return pie;
    }

    function draw( that, el ) {
        el = d3.select( el );

        if ( el.attr( "data-color-chart" ) != "pie" ) {
            el.attr( "data-color-chart", "pie" )
                .text( "" );
        }

        var height = that.height.get( el )
        var width = that.width.get( el )
        var radius = Math.min( height / 2, width / 2 ) - 10;

        // read the data, either from the legend or the element
        var data = that.data() || el.datum();

        // extract the values for each obj
        data = data.map( function ( d ) {
            var v = +d[ that.value() ]

            if ( isNaN( v ) ) {
                throw new Error( "pie value must be a number" );
            }

            return { v: v, c: d[ that.color() ], obj: d }
        })

        // group by colors
        data = d3.nest()
            .key( function ( d ) { return d.c  || "" } )
            .rollup ( function ( data ) {
                return data.reduce( function ( v, d ) {
                    return v + d.v;
                }, 0 )
            })
            .entries( data );

        // lay out the pie
        data = d3.layout.pie()
            .sort( null )
            .value( function ( d ) { 
                return d.values
            })( data )
            .map( function ( d ) {
                d.key = d.data.key;
                delete d.data;
                return d;
            });

        var c = color.palette()
            .colors( that.palette() )
            .domain( data.map( function ( d ) { return d.key } ) )
            .scale();

        var arc = d3.svg.arc()
            .outerRadius( radius )
            .innerRadius( 0 );

        // tooltip
        var tooltip = color.tooltip()
            .title( function ( d ) {
                return !d.key 
                    ? that.value()
                    : d.key
            })
            .content( function ( d ) {
                return !d.key 
                    ? d.value
                    : that.value() + ": " + d.value;
            })

        // draw the legend
        var legend = c.domain().length > 1;
        var legend = el.selectAll( "g[data-pie-legend]" )
            .data( legend ? [ data ] : [] );
        legend.enter().append( "g" )
            .attr( "data-pie-legend", "" )
            .attr( "transform", "translate(35,10)" )
        legend.call( that.legend().palette( that.palette() ) );

        // start drawing
        var pies = el.selectAll( "g[data-pie]" )
            .data( [ data ] );
        pies.enter().append( "g" )
            .attr( "data-pie", "" )
            .attr( "transform", function () {
                return "translate(" + ( width / 2 ) + "," + ( height / 2 ) + ")";
            });

        var slices = pies.selectAll( "path[data-pie-slice]" )
            .data( function ( d ) { return d } );
        slices.exit().remove();
        slices.enter().append( "path" );
        slices
            .attr( "data-pie-slice", function ( d ) {
                return d.key;
            })
            .attr( "d", arc )
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
            .call( tooltip );
    }

})();

