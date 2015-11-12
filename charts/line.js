(function () {
    var color = window.color;
    var getset = color.getset;
    
    color.line = function () {
        var options = {
            x: null,
            y: null,
            stack: false,
            color: null,
            palette: window.color.palettes.default,
            data: null,
            legend: color.legend()
                .value( "key" )
                .color( "key" )
        }

        function line ( el ) { return line.draw( bar, el ) }
        line.x = getset( options, "x" );
        line.y = getset( options, "y" );
        line.stack = getset( options, "stack" );
        line.color = getset( options, "color" );
        line.palette = getset( options, "palette" );
        line.data = getset( options, "data" );
        line.legend = getset( options, "legend" );
        line.draw = function ( el ) {
            draw( this, el );
            return this;
        }

        return line;
    }

    function draw( that, el ) {
        el = d3.select( el );
        var svg = el.select( "svg" );

        if ( !svg.node() || svg.attr( "data-color" ) != "chart-line" ) {
            el.node().innerHTML = "<svg></svg>";
            svg = el.select( "svg" )
                .attr( "data-color", "chart-line" )
                .style( "height", "100%" )
                .style( "width", "100%" );
        }

        // extract the values for each obj
        var data = that.data().map( function ( d ) {
            var x = d[ that.x() ];
            var y = +d[ that.y() ];

            if ( !( x instanceof Date ) && isNaN( +x ) ) {
                throw new Error( "x-dimension must be a number or a Date" );
            }

            if ( isNaN( y ) ) {
                throw new Error( "y-dimension must be a number" );
            }

            return { x: x, y: y, y0: 0, c: d[ that.color() ], obj: d }
        })
        
        var isTimeline = ( data[ 0 ] || {} ).x instanceof Date;

        // group by colors
        var xExtent = d3.extent( data, function ( d ) { return d.x } );
        data = d3.nest()
            .key( function ( d ) { return d.c  || "" } )
            .rollup( function ( data ) {

                // aggregate duplicate items for the same x-coordinate
                // for cases where multiple items have the same x-value
                data = d3.nest()
                    .key( function ( d ) { return d.x } )
                    .rollup( function ( items ) {
                        return items.reduce( function ( v, d ) {
                            v.y += d.y;
                            return v;
                        }, items[ 0 ] );
                    })
                    .entries( data )
                    .map( function ( d ) { return d.values } );

                // if this line begins after the chart's start, add a zero-
                // height segment to precede it
                var minx = d3.min( data, function ( d ) { return d.x } );
                if ( minx != xExtent[ 0 ] ) {
                    data.unshift( 
                        { x: minx, y: 0, y0: 0 }, 
                        { x: xExtent[ 0 ], y: 0, y0: 0 }
                    );
                }

                // if this line begins before the chart's end, add a zero-
                // height segment to succeed it
                var maxx = d3.max( data, function ( d ) { return d.x } );
                if ( maxx != xExtent[ 1 ] ) {
                    data.push( 
                        { x: maxx, y: 0, y0: 0 }, 
                        { x: xExtent[ 1 ], y: 0, y0: 0 }
                    )
                }

                // sort it by the x-coordinate to make sure the path the drawing
                // is sane. d3 requires the input data to be ordered by the 
                // x-coordinate in order to draw properly
                data.sort( function ( d1, d2 ) {
                    return d1.x - d2.x;
                })

                return data;
            })
            .entries( data );

        // fill-in the gaps
        // d3 requires that all series groups will have same x-coordinates in 
        // order to draw the lines correctly. This code fills in the gaps in the
        // dataset by interpolating the would-be y-coordinate.
        var leaves = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 2 } )
            .values( function ( d ) { return d.values || d } )
            .entries( data );

        // iterate over all array-indices, until we reach an index where none of 
        // the data items have a value for - thus reaching the end.
        var i, ix;
        for ( i = 0 ; ; i += 1 ) {
            // compute the minimal x-value that should be associated with this 
            // array-index
            ix = d3.min( data, function ( d ) { 
                return ( d.values[ i ] || {} ).x 
            });

            // if no values exist for this array-index, on all lines, we're done
            if ( ix == undefined ) { break }

            // ensure that all values contains the same x-coordinate on this 
            // array-index
            data.forEach( function ( d ) {
                var d1 = d.values[ i ];

                if ( d1.x == ix ) return;

                // incorrect x-coordinate for this array-index, add an 
                // artificial point as the interpolation between the current
                // point, and the previous one.
                d.values.splice( i, 0, interp( d )( ix ) )
            })
        }

        // stack the data
        d3.layout.stack()
            .values( function ( d ) { 
                return d.values
            })( that.stack() ? data : [] );

        // build the scales
        var x = ( isTimeline ? d3.time.scale() : d3.scale.linear() )
            .domain( xExtent )
            .range( [ 0, svg.node().offsetWidth ] )

        var yExtent = d3.extent( leaves, function ( d ) { return d.y + d.y0 } );
        var y = d3.scale.linear()
            .domain( [ 0, yExtent[ 1 ] ] )
            .range( [ svg.node().offsetHeight, 8 ] );

        var palette = that.palette();
        var allc = data.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ palette.from, palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( palette )

        var c = palette.from && palette.to ? clin : cord;

        var area = d3.svg.area()
            .x( function ( d ) { return x( d.x ) })
            .y0( function ( d ) { return y( d.y0 ) })
            .y1( function ( d ) { return y( d.y0 + d.y ) })

        var line = d3.svg.line()
            .x( function ( d ) { return x( d.x ) })
            .y( function ( d ) { return y( d.y0 + d.y ) })

        // draw the legend
        // only if we have more than one color
        var legend = c.domain().length > 1;
        var legend = svg.selectAll( "g[data-line-legend]" )
            .data( legend ? [ data ] : [] )
        legend.exit().remove();
        legend.enter().append( "g" )
            .attr( "data-line-legend", "" )
            .attr( "transform", "translate(35,10)" )
        legend.call( that.legend().palette( palette ) );
        legend = legend.node()
        if ( legend ) {
            var height = legend.getBBox().height;
            y.range([ y.range()[ 0 ], y.range()[ 1 ] + height + 20 ])
        }

        // start drawing
        var axis = svg.selectAll( "g[data-line-axis='x']" )
            .data( [ data ] )

        axis.enter().append( "g" )
            .attr( "data-line-axis", "x" )
            .attr( "transform", "translate(0," + ( y.range()[ 0 ] - 30 ) + ")" );

        axis.call( xlabels( x, y ) )

        var groups = svg.selectAll( "g[data-line-group]" )
            .data( data );
        groups.exit().remove();
        groups.enter().append( "g" )
        groups.attr( "data-line-group", function ( d ) {
            return d.key;
        })

        var lines = groups.selectAll( "path[data-line]" )
            .data( function ( d ) { return [ d ] } )
        lines.exit().remove();
        lines.enter().append( "path" )
            .attr( "data-line", "" )
            .attr( "fill", "none" )
        lines
            .attr( "d", function ( d ) { 
                return line( d.values ) 
            })
            .attr( "stroke", function ( d ) {
                return c( d.key );
            });

        var areas = groups.selectAll( "path[data-line-area]" )
            .data( function ( d ) { return [ d ] } );
        areas.exit().remove()
        areas.enter().append( "path" )
            .attr( "data-line-area", "" )
            .attr( "stroke", "none" )
        areas
            .attr( "d", function ( d ) { 
                return area( d.values ) 
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
            .style( "opacity", that.stack() ? .4 : .1 );

        var points = groups.selectAll( "circle[data-line-point]" )
            .data( function ( d ) { return d.values })
        points.exit().remove()
        points.enter().append( "circle" )
            .attr( "data-line-point", "" )
            .attr( "fill", function ( d ) {
                var key = this.parentNode.getAttribute( "data-line-group" );
                return c( key );
            })

        var xs = [];
        xs.__map = {};
        points
            .transition()
            .attr( "r", function ( d ) {
                // only show the points that were included in the original 
                // dataset, excluding the ones that were generated to draw the 
                // chart
                return d.obj ? 0 : 0;
            })
            .attr( "stroke-width", 60 )
            .attr( "stroke", "transparent" )
            .attr( "cx", function ( d ) { 
                var dx = x( d.x );
                if ( !xs.__map[ dx ] ) {
                    xs.push( xs.__map[ dx ] = { x: dx, p: [] });
                }
                if ( d.obj ) {
                    xs.__map[ dx ].p.push( this );
                }
                return dx;
            })
            .attr( "cy", function ( d ) {
                return y( d.y0 + d.y );
            })
            .attr( "fill", function ( d ) {
                var key = this.parentNode.getAttribute( "data-line-group" );
                return c( key );
            });

        // build the hoverpoints behavior
        color.hoverpoints()
            .x( x )
            .y( y )
            .color( c )
            .data( data )
            .draw( svg );
    }

    function xlabels ( x, y ) {
        var xAxis = d3.svg.axis()
            .scale( x )
            .orient( "bottom" )
            .tickSize( 10, 0 )
            .ticks( 7 );

        return function () {
            var maxh = 0;
            this.call( xAxis )
                .each( function () {
                    d3.select( this )
                        .selectAll( "path.domain" )
                        .attr( "fill", "white" );
                })
                .selectAll( "g.tick" )
                    .each( function () {
                        var tick = d3.select( this );
                        // tick.select( "line" ).attr( "stroke", "white" )
                        var text = tick.select( "text" )
                            .attr( "fill", "white" )

                        maxh = Math.max( maxh, text.node().offsetHeight );
                    });

            maxh = maxh ? maxh + 8 : 0; 
            y.range([ 
                y.range()[ 0 ] - maxh, 
                y.range()[ 1 ] 
            ])
        }
    }

    function interp ( d ) {
        return function ( x ) {
            var i = 0;

            // find the 2 points immediately before and after the provided
            // x-coordinate.
            while ( d.values[ i ] && d.values[ i ].x < x ) { i += 1 }
            var d1 = d.values[ i ];
            var d0 = d.values[ i - 1 ] || d1;

            // interpolate between these 2 points
            var total = d1.x - d0.x;
            var part = x - d0.x;
            return d3.interpolate(
                { x: d0.x, y: d0.y, y0: d0.y0 }, 
                { x: d1.x, y: d1.y, y0: d1.y0 }
            )( part / total );
        }
    }

})();
