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

        // extract the values for each obj
        var data = that.data().map( function ( d ) {
            var y = +d[ that.y() ];
            if ( isNaN( y ) ) {
                throw new Error( "y-dimension must be a number" );
            }

            return { 
                x0: d[ that.x0() ], x1: d[ that.x1() ], c: d[ that.color() ],
                y: y, y0: 0, obj: d 
            }
        })

        // build the groups tree
        data = d3.nest()
            .key( function ( d ) { return d.x0 || "" } )
            .key( function ( d ) { return d.x1 || "" } )
            .key( function ( d ) { return d.c  || "" } )
            .rollup( function ( data ) {
                return data.reduce( function ( v, d ) {
                    return { y: v.y + d.y, y0: 0 };
                }, { y: 0, y0: 0 } )
            })
            .entries( data );

        // extract the colors and bars from the data tree
        var bars = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 2 } )
            .values( function ( d ) { return d.values || d } )
            .entries( data );

        var colors = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 3 } )
            .values( function ( d ) { return d.values || d } )
            .entries( data );

        // stack the colors
        bars.map( function ( data ) {
            return data.values.map( function ( d ) { 
                return [ d.values ] 
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

        var ally = colors.map( function ( d ) { return d.values.y + d.values.y0 } );
        var y = d3.scale.linear()
            .domain([ 0, d3.max( ally ) ])
            .rangeRound([ svg.node().offsetHeight, 0 ] );

        var palette = that.palette();
        var allc = colors.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ palette.from, palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( palette )

        var c = palette.from && palette.to ? clin : cord;

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
        legend.call( that.legend().palette( palette ) );
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
            .data( function ( d ) { return d.values } );
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
            })

        var rects = bars.selectAll( "rect[data-bar-color]" )
            .data( function ( d ) { return d.values } );
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
            .transition()
            .attr( "y", function ( d ) {
                // start at the baseline + the height
                return y( d.values.y + d.values.y0 );
            })
            .attr( "height", function ( d ) {
                // height is end - start (as it's defined in y)
                return y( d.values.y0 ) - y( d.values.y + d.values.y0 );
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


})();
