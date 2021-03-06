(function() {
    var color = window.color;
    var getset = color.getset;

    color.bar = function () {
        var options = {
            width: color.available( "width" ),
            height: color.available( "height" ),
            x0: null,
            x1: null,
            y: null,
            color: null,
            palette: window.color.palettes.default,
            data: null,
            legend: color.legend()
                .value( "key" )
                .color( "key" ),
            xaxis: color.xaxis(),
            yaxis: color.yaxis()
                .inplace( true )
        }

        function bar () { return bar.draw( this ) }
        bar.width = getset( options, "width" );
        bar.height = getset( options, "height" );
        bar.x = getset( options, "x0" );
        bar.x0 = getset( options, "x0" );
        bar.x1 = getset( options, "x1" );
        bar.y = getset( options, "y" );
        bar.color = getset( options, "color" );
        bar.palette = getset( options, "palette" );
        bar.legend = getset( options, "legend" );
        bar.xaxis = getset( options, "xaxis" );
        bar.yaxis = getset( options, "yaxis" );
        bar.data = getset( options, "data" );
        bar.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( bar, bar.data() || data );
                draw( bar, this, data ); 
            })
            return this;
        }

        return bar;
    }

    function draw( that, el, data ) {
        el = d3.select( el );

        if ( el.attr( "data-color-chart" ) != "bar" ) {
            el.attr( "data-color-chart", "bar" )
                .text( "" );
        }
        el.node().__colorchart = that;

        var height = that.height.get( el )
        var width = that.width.get( el )
        
        // build the scales
        var allx0 = data.map( function ( d ) { return d.key } );
        var x0 = d3.scale.ordinal()
            .domain( allx0 )
            .rangeRoundBands([ 0, width ], .1 );

        var allx1 = data.bars().map( function ( d ) { return d.key } )
        var x1 = d3.scale.ordinal()
            .domain( allx1 )
            .rangeRoundBands( [ 0, x0.rangeBand() ], .01 )

        var ally = data.colors().map( function ( d ) { return d.y + d.y0 } );
        var y = d3.scale.linear()
            .domain([ 0, d3.max( ally ) ])
            .rangeRound([ height, 0 ] );

        var c = color.palette()
            .colors( that.palette() )
            .domain( data.colors().map( function ( d ) { return d.key } ) )
            .scale();

        var tooltip = color.tooltip()
            .content( function ( d ) {
                var keys = [ that.y(), that.x0(), that.x1(), that.color() ];
                return keys.filter( color.identity )
                    .map( function ( key ) {
                        return key + ": " + d.obj[ key ];
                    }).join( "<br />" );
            })
            .title( function ( d ) {
                return d.c || d.x1 || d.x0;
            })

        // draw the legend
        // only if there's more than 1 color, and we don't show the labels on
        // the group (x0)
        var legend = c.domain().length > 1
            && that.color() != that.x0();
        var legend = el.selectAll( "g[data-bar-legend]" )
            .data( legend ? [ data.colors() ] : [] )
        legend.exit().remove();
        legend.enter().append( "g" )
            .attr( "data-bar-legend", "" )
            .attr( "transform", "translate(35,10)" )
        legend.call( that.legend().palette( that.palette() ) );
        legend = legend.node()
        if ( legend ) {
            var height = legend.getBBox().height;
            y.range([ y.range()[ 0 ], y.range()[ 1 ] + height + 20 ])
        }

        // draw the bars
        var groups = el.selectAll( "g[data-bar-group]" )
            .data( data );
        groups.exit().remove();
        groups.enter().append( "g" )
        groups.attr( "data-bar-group", function ( d ) {
                return d.key;
            })
            .attr( "transform", function ( d ) {
                return "translate(" + x0( d.key ) + ",0)";
            });

        // draw the x0-axis
        var axis = el.selectAll( "g[data-line-axis='x']" )
            .data( [ data ] )
        axis.enter().append( "g" )
            .attr( "data-line-axis", "x" )
            .attr( "transform", "translate(0," + ( y.range()[ 0 ] - 30 ) + ")" );
        axis.call( that.xaxis().x( x0 ).y( y ) );

        // draw the bars
        var bars = groups.selectAll( "g[data-bar]" )
            .data( color.identity );
        bars.exit().remove();
        bars.enter().append( "g" )
            .attr( "data-bar", function ( d ) {
                return d.key;
            });

        // draw the y-axis
        var axis = el.selectAll( "g[data-line-axis='y']" )
            .data( [ data ] )
        axis.enter().append( "g" )
            .attr( "data-line-axis", "y" )
            // .attr( "transform", "translate(0," + ( y.range()[ 0 ] - 30 ) + ")" );
        axis.call( that.yaxis().x( x0 ).y( y ) );

        // bars
        //     .call( ylabels( x1, y, c ) )
        //     .transition()
        //     .attr( "transform", function ( d ) {
        //         return "translate(" + x1( d.key ) + ",0)";
        //     });

        var rects = bars.selectAll( "rect[data-bar-color]" )
            .data( color.identity );
        rects.exit().remove();
        rects.enter().append( "rect" )
            .attr( "data-bar-color", function ( d ) {
                return d.key;
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })

        rects
            .call( tooltip )
            .transition()
            .attr( "y", function ( d ) {
                // start at the baseline + the height
                return y( d.y + d.y0 );
            })
            .attr( "height", function ( d ) {
                // height is end - start (as it's defined in y)
                return y( d.y0 ) - y( d.y + d.y0 );
            })
            .attr( "width", function ( d ) {
                return x1.rangeBand()
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
    }

    function layout( that, data ) {
        // extract the values for each obj
        data = data.map( function ( d ) {
            var obj = {};
            var x0 = d[ that.x0() ];
            var x1 = d[ that.x1() ];
            var c = d[ that.color() ];
            var y = +d[ that.y() ];
            if ( isNaN( y ) ) {
                throw new Error( "y-dimension must be a number" );
            }

            return { x0: x0, x1: x1, c: c, y: y, y0: 0, obj: d }
        })


        data = d3.nest()
            .key( function ( d ) { return d.x0 || "" } )
            .key( function ( d ) { return d.x1 || "" } )
            .key( function ( d ) { return d.c  || "" } )
            .rollup( function ( data ) {
                for ( var i = 1 ; i < data.length ; i += 1 ) {
                    data[ 0 ].y += data[ i ].y
                }
                return data[ 0 ];
            })
            .entries( data )
            .map( flatten );

        var bars = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 2 } )
            .entries( data );

        var colors = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 3 } )
            .entries( data );

        // stack the colors in each bar
        bars.map( function ( data ) {
            return data.map( function ( d ) {  return [ d ] })
        })
        .forEach( d3.layout.stack() );

        data.bars = function () { return bars }
        data.colors = function () { return colors }
        return data;
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
