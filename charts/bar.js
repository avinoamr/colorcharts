(function() {
    var color = window.color;
    var getset = color.getset;

    color.bar = function () {
        var options = {
            x0: null,
            x1: null,
            y: null,
            color: null,
            palette: window.color.palettes.default,
            data: null,
            legend: color.legend()
                .value( "key" )
                .color( "key" )
        }

        function bar ( el ) { return bar.draw( bar, el ) }
        bar.x = getset( options, "x0" );
        bar.x0 = getset( options, "x0" );
        bar.x1 = getset( options, "x1" );
        bar.y = getset( options, "y" );
        bar.color = getset( options, "color" );
        bar.palette = getset( options, "palette" );
        bar.data = getset( options, "data" );
        bar.legend = getset( options, "legend" );
        bar.draw = function ( el ) {
            draw( this, el );
            return this;
        }

        return bar;
    }

    function draw( that, el ) {
        el = d3.select( el );
        var svg = el.select( "svg" );

        if ( !svg.node() || svg.attr( "data-color" ) != "chart-bar" ) {
            el.node().innerHTML = "<svg></svg>";
            svg = el.select( "svg" )
                .attr( "data-color", "chart-bar" )
                .style( "height", "100%" )
                .style( "width", "100%" );
        }

        function getter( key ) {
            if ( typeof key == "function" ) {
                return key;
            } else {
                return function ( d ) {
                    return d[ key ];
                }
            }
        }

        var getx0 = getter( that.x0() );
        var getx1 = getter( that.x1() );
        var getc = getter( that.color() );

        // extract the values for each obj
        var data = that.data().map( function ( d ) {
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

        // build the groups tree
        data = d3.nest()
            .key( function ( d ) { return d.x0 || "" } )
            .key( function ( d ) { return d.x1 || "" } )
            .key( function ( d ) { return d.c  || "" } )
            .rollup( function ( data ) {
                return data.reduce( function ( v, d ) {
                    v.y += d.y;
                    return v;
                }, data[ 0 ] );
            })
            .entries( data )
            .map( flatten );

        // extract the colors and bars from the data tree
        var bars = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 2 } )
            .entries( data );

        var colors = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 3 } )
            .entries( data );

        // stack the colors
        bars.map( function ( data ) {
            return data.map( function ( d ) { 
                return [ d ] 
            })
        })
        .forEach( d3.layout.stack() );
        
        // build the scales
        var allx0 = data.map( function ( d ) { return d.key });
        var x0 = d3.scale.ordinal()
            .domain( allx0 )
            .rangeRoundBands([ 0, svg.node().offsetWidth ], .1 );

        var allx1 = bars.map( function ( d ) { return d.key })
        var x1 = d3.scale.ordinal()
            .domain( allx1 )
            .rangeRoundBands( [ 0, x0.rangeBand() ], .01 )

        var ally = colors.map( function ( d ) { return d.y + d.y0 } );
        var y = d3.scale.linear()
            .domain([ 0, d3.max( ally ) ])
            .rangeRound([ svg.node().offsetHeight, 0 ] );

        var c = color.palette()
            .colors( that.palette() )
            .domain( colors.map( function ( d ) { return d.key } ) )
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
        // the group (x0) and bar (x1)
        var legend = c.domain().length > 1
            && that.color() != that.x0()
            && that.color() != that.x1();
        var legend = svg.selectAll( "g[data-bar-legend]" )
            .data( legend ? [ colors ] : [] )
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
        var groups = svg.selectAll( "g[data-bar-group]" )
            .data( data );
        groups.exit().remove();
        groups.enter().append( "g" )
            .attr( "data-bar-group", function ( d ) {
                return d.key;
            })
            .attr( "transform", function ( d ) {
                return "translate(" + x0( d.key ) + ",0)";
            })

        groups
            .call( xlabels( x0, y ) )
            .transition()
            .attr( "transform", function ( d ) {
                return "translate(" + x0( d.key ) + ",0)";
            })

        var bars = groups.selectAll( "g[data-bar]" )
            .data( color.identity );
        bars.exit().remove();
        bars.enter().append( "g" )
            .attr( "data-bar", function ( d ) {
                return d.key;
            });

        bars
            .call( xlabels( x1, y ) )
            .transition()
            .attr( "transform", function ( d ) {
                return "translate(" + x1( d.key ) + ",0)";
            });

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
            .each( function () {
                this.addEventListener( "mouseenter", mouseEnter( svg ) )
                this.addEventListener( "mouseleave", mouseLeave( svg ) )
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

    function mouseEnter ( svg ) {
        return function () {
            d3.select( this )
                .transition()
                .style( "opacity", .7 )
        }
    }

    function mouseLeave ( svg ) {
        return function () {
            d3.select( this )
                .transition()
                .style( "opacity", 1 )
        }
    }

    function xlabels ( x, y ) {
        var h = y.range()[ 1 ] - y.range()[ 0 ];
        var w = x.rangeBand() / 2;
        return function ( groups ) {
            var labels = groups.selectAll( "text" )
                .data( function ( d ) { return [ d ] } )

            labels.enter().append( "text" );
            labels.exit().remove();
            labels
                .text( function ( d ) { return d.key })
                .style( "font", "12px roboto_condensedregular" )
                .style( "fill", "white" )
                .attr( "text-anchor", "middle" )
                .attr( "transform", function ( d ) {
                    return "translate(" + w + "," + ( y.range()[ 0 ] - 3 ) + ")"
                })

            // side-effect: modify the y-range to leave space for the label
            var maxh = d3.max( labels, function ( text ) {
                return text[ 0 ].offsetHeight;
            })

            maxh += maxh ? 4 : 0;
            y.rangeRound([ 
                y.range()[ 0 ] - maxh, 
                y.range()[ 1 ] 
            ])
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
