(function () {
    var color = window.color;
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

            if ( !( x instanceof Date ) || isNaN( +x ) ) {
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

        var xAll = leaves.map( function ( d ) { return d.x });

        data.map( function ( d ) {
            return d.values;
        })
        .forEach( function ( data ) {
            xAll.forEach( function ( x ) {
                var closest = data.reduce( function ( closest, d, i ) {
                    return d.x > x ? closest : { x: d.x, y: d.y, i: i };
                }, { x: data[ 0 ].x, y: data[ 0 ].y, i: 0 } );

                if ( x == closest.x ) return; 
                var after = data[ closest.i + 1 ];

                var total = after.x - closest.x;
                var part = x - closest.x;

                var y = d3.interpolate( closest.y, after.y )( part / total );
                data.splice( closest.i + 1, 0, { x: x, y: y, y0: 0 } )
            })
        })

        // stacke the data
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
            .range( [ svg.node().offsetHeight, 4 ] );

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
        that.legend()
            .palette( palette )
            .data( data )
            .draw( legend )
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
            .data( function ( d ) { 
                // only show the points that were included in the original 
                // dataset, excluding the ones that were generated to draw the 
                // chart
                return d.values.filter( function ( d ) { return !!d.obj })
            })
        points.exit().remove()
        points.enter().append( "circle" )
            .attr( "data-line-point", "" )
            .attr( "r", 2 )

        points
            .attr( "cx", function ( d ) { 
                return x( d.x ) 
            })
            .attr( "cy", function ( d ) {
                return y( d.y0 + d.y );
            })
            .attr( "fill", function ( d ) {
                var key = this.parentNode.getAttribute( "data-line-group" );
                return c( key );
            })
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
