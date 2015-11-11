(function () {
    var color = window.color;
    color.pie = function () {
        var options = {
            value: null,
            color: null,
            palette: window.color.palettes.default,
            data: null,
            legend: color.legend()
                .color( "key" )
                .value( "key" )
                .direction( "vertical" )
        }

        function pie ( el ) { return pie.draw( bar, el ) }
        pie.value = getset( options, "value" );
        pie.color = getset( options, "color" );
        pie.palette = getset( options, "palette" );
        pie.data = getset( options, "data" );
        pie.legend = getset( options, "legend" );
        pie.draw = function ( el ) {
            draw( this, el );
            return this;
        }

        return pie;
    }

    function draw( that, el ) {
        el = d3.select( el );
        var svg = el.select( "svg" );

        if ( !svg.node() || svg.attr( "data-color" ) != "chart-pie" ) {
            el.node().innerHTML = "<svg></svg>";
            svg = el.select( "svg" )
                .attr( "data-color", "chart-pie" )
                .style( "height", "100%" )
                .style( "width", "100%" );
        }

        var height = svg.node().offsetHeight;
        var width = svg.node().offsetWidth;
        var radius = Math.min( height / 2, width / 2 ) - 10;

        // extract the values for each obj
        var data = that.data().map( function ( d ) {
            var v = +d[ that.value() ]

            if ( isNaN( v ) ) {
                throw new Error( "value must be a number" );
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

        var palette = that.palette();
        var allc = data.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ palette.from, palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( palette )

        var c = palette.from && palette.to ? clin : cord;

        var arc = d3.svg.arc()
            .outerRadius( radius )
            .innerRadius( 0 );

        // summary
        var summary = svg.selectAll( "g[data-pie-summary]" )
            .data( [ data ] )
        summary.enter().append( "g" )
            .attr( "data-pie-summary", "" )
            .attr( "transform", "translate(" + ( width - 200 ) + ",0)" );

        // draw the legend
        var legend = svg.selectAll( "g[data-pie-legend]" )
            .data( [ data ] );
        legend.enter().append( "g" )
            .attr( "data-pie-legend", "" )
            .attr( "transform", "translate(35,10)" )
        legend.call( that.legend().palette( palette ) );

        // start drawing
        var pies = svg.selectAll( "g[data-pie]" )
            .data( [ data ] );
        pies.enter().append( "g" )
            .attr( "data-pie", "" )
            .attr( "transform", function () {
                return "translate(" + ( width / 2 ) + "," + ( height / 2 ) + ")";
            });

        var slices = pies.selectAll( "path[data-pie-slice]" )
            .data( function ( d ) { return d } );
        slices.exit().remove();
        slices.enter().append( "path" )
            .each( function () {
                this.addEventListener( "mouseenter", mouseEnter( summary ) )
                this.addEventListener( "mouseleave", mouseLeave( summary ) )
            })
        slices
            .attr( "data-pie-slice", function ( d ) {
                return d.key;
            })
            .attr( "d", arc )
            .attr( "fill", function ( d ) {
                return c( d.key );
            })

    }

    function mouseEnter( summary ) {
        return function ( ev ) {
            var datum = d3.select( this ).datum();
            summary
                .datum( [ datum ] )
                .call( color.numbers() )


            var slice = this;
            var parent = d3.select( slice.parentNode );
            parent.selectAll( "path[data-pie-slice]" )
                .each( function () {
                    d3.select( this )
                        .transition()
                        .style( "opacity", this == slice ? 1 : .8 )
                })
        }
    }

    function mouseLeave( summary ) {
        return function ( ev ) {
            summary
                .datum( [] )
                .call( color.numbers() )
            var parent = d3.select( this.parentNode );
            parent.selectAll( "path[data-pie-slice]" )
                .transition()
                .style( "opacity", 1 );
        }
    }

    function getset ( options, key ) {
        return function ( value ) {
            if ( arguments.length == 0 ) {
                return options[ key ];
            }

            options[ key ] = value;
            return this;
        }
    }

})();

