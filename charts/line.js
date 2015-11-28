(function () {
    var color = window.color;
    var getset = color.getset;
    
    color.line = function () {
        var options = {
            width: color.available( "width" ),
            height: color.available( "height" ),
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

        function line ( el ) { return line.draw( this ) }
        line.width = getset( options, "width" );
        line.height = getset( options, "height" );
        line.x = getset( options, "x" );
        line.y = getset( options, "y" );
        line.stack = getset( options, "stack" );
        line.color = getset( options, "color" );
        line.palette = getset( options, "palette" );
        line.data = getset( options, "data" );
        line.legend = getset( options, "legend" );
        line.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( line, line.data() || data );
                draw( line, this, data ); 
            })
            return this;
        }

        return line;
    }

    function draw ( that, el, data ) {
        el = d3.select( el );
        
        if ( el.attr( "data-color-chart" ) != "line" ) {
            el.attr( "data-color-chart", "line" )
                .text( "" );
        }
        el.node().__colorchart = that;

        var height = that.height.get( el )
        var width = that.width.get( el )

        // build the scales
        var xExtent = d3.extent( data.leaves(), function ( d ) { 
            return d.x
        });
        var x = ( data.isTimeline() ? d3.time.scale() : d3.scale.linear() )
            .domain( xExtent )
            .range( [ 0, width ] )

        var yExtent = d3.extent( data.leaves(), function ( d ) { 
            return d.y + d.y0 
        });
        var y = d3.scale.linear()
            .domain( [ 0, yExtent[ 1 ] ] )
            .range( [ height, 8 ] );

        var c = color.palette()
            .colors( that.palette() )
            .domain( data.map( function ( d ) { return d.key } ) )
            .scale();

        var hoverpoints = color.hoverpoints()
            .x( x )
            .y( y )
            .color( c )
        hoverpoints.tooltip()
            .content( function ( data ) {
                return data.filter( function ( d ) {
                    return !!d.point.obj
                })
                .map( function ( d ) {
                    return ( d.point.c || that.y() ) + ": " + d.point.y
                }).join( "<br/>" );
            })

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
        var legend = el.selectAll( "g[data-line-legend]" )
            .data( legend ? [ data ] : [] )
        legend.exit().remove();
        legend.enter().append( "g" )
            .attr( "data-line-legend", "" )
            .attr( "transform", "translate(35,10)" )
        legend.call( that.legend().palette( that.palette() ) );
        legend = legend.node()
        if ( legend ) {
            var height = legend.getBBox().height;
            y.range([ y.range()[ 0 ], y.range()[ 1 ] + height + 20 ])
        }

        // draw the axes
        var axis = el.selectAll( "g[data-line-axis='x']" )
            .data( [ data ] )
        axis.enter().append( "g" )
            .attr( "data-line-axis", "x" )
            .attr( "transform", "translate(0," + ( y.range()[ 0 ] - 30 ) + ")" );
        axis.call( xlabels( x, y ) )

        var axis = el.selectAll( "g[data-line-axis='y']" )
            .data( [ data ] )
        axis.enter().append( "g" )
            .attr( "data-line-axis", "y" )
        axis.call( ylabels( x, y ) )


        // start drawing
        var groups = el.selectAll( "g[data-line-groups]" )
            .data( [ data ] );
        groups.enter().append( "g" )
            .attr( "data-line-groups", "" );
        var groups = groups.selectAll( "g[data-line-group]" )
            .data( color.identity );
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
                return line( d ) 
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
                return area( d ) 
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
            .style( "opacity", that.stack() ? .4 : .1 );

        // attach the hoverpoints behavior
        var hovergroup = el.selectAll( "g[data-line-hoverpoints]" )
            .data( [ data ] )
        hovergroup.enter().append( "g" )
            .attr( "data-line-hoverpoints", "" )
        hovergroup.call( hoverpoints );
    }

    function layout ( that, data ) {
        // extract the values for each obj
        data = data.map( function ( d ) {
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
            .entries( data )
            .map( flatten );

        // fill-in the gaps
        // d3 requires that all series groups will have same x-coordinates in 
        // order to draw the lines correctly. This code fills in the gaps in the
        // dataset by interpolating the would-be y-coordinate.
        var leaves = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 2 } )
            .entries( data );

        // iterate over all array-indices, until we reach an index where none of 
        // the data items have a value for - thus reaching the end.
        var i, ix;
        for ( i = 0 ; ; i += 1 ) {
            // compute the minimal x-value that should be associated with this 
            // array-index
            ix = d3.min( data, function ( d ) { 
                return ( d[ i ] || {} ).x 
            });

            // if no values exist for this array-index, on all lines, we're done
            if ( ix == undefined ) { break }

            // ensure that all values contains the same x-coordinate on this 
            // array-index
            data.forEach( function ( d ) {
                var d1 = d[ i ];

                if ( d1.x == ix ) return;

                // incorrect x-coordinate for this array-index, add an 
                // artificial point as the interpolation between the current
                // point, and the previous one.
                d.splice( i, 0, interp( d )( ix ) )
            })
        }

        // stack the data
        d3.layout.stack()
            .values( function ( d ) { 
                return d
            })( that.stack() ? data : [] );

        data.leaves = function () { return leaves }
        data.isTimeline = function () { return isTimeline }
        return data;
    }

    function ylabels ( x, y ) {
        var width = x.range()[ 1 ] - x.range()[ 0 ];
        var yAxis = d3.svg.axis()
            .scale( y )
            .orient( "left" )
            .tickSize( width, 0 )
            .ticks( 3 )

        return function () {
            var maxw = 0;
            this
                .call( yAxis )
                .each( function () {
                    d3.select( this )
                        .selectAll( "path.domain" )
                        .attr( "fill", "white" );
                })
                .selectAll( "g.tick" )
                    .each( function () {
                        var tick = d3.select( this );
                        tick.select( "line" )
                            .attr( "stroke", "rgba(255,255,255,.1)" )
                        var text = tick.select( "text" )
                            .attr( "fill", "rgba(255,255,255,.5)" )

                        maxw = Math.max( maxw, text.node().offsetWidth );
                    });
            
            maxw = maxw ? maxw + 8 : 0; 
            this.attr( "transform", "translate(" + ( width + maxw ) + ",0)" );

        }
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
            while ( d[ i ] && d[ i ].x < x ) { i += 1 }
            var d1 = d[ i ];
            var d0 = d[ i - 1 ] || d1;

            // interpolate between these 2 points
            var total = d1.x - d0.x;
            var part = x - d0.x;
            var interpd = d3.interpolate(
                { x: d0.x, y: d0.y, y0: d0.y0 }, 
                { x: d1.x, y: d1.y, y0: d1.y0 }
            )( part / total );

            interpd.x = x;
            return interpd;
        }
    }

    function flatten ( d ) {
        if ( !d.values ) return d;
        if ( Array.isArray( d.values ) ) {
            d.values = d.values.map( flatten );
        }
        d.values.key = d.key
        return d.values;
    }

})();
