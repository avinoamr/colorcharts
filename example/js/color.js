(function () {
    window.color = {}
})();
(function () {
    var color = window.color;
    color.tree = {};

    color.tree.dfs = function () {
        var filter = function ( d ) { return d };
        var values = function ( d ) { return d };

        var fn = function ( data ) {
            return fn.entries( data )
        }

        fn.entries = function ( data ) {
            return dfs( data, 0, 0 )
        }

        fn.filter = function ( _filter ) {
            filter = _filter;
            return this;
        }

        fn.values = function ( _values ) {
            values = _values;
            return this;
        }

        return fn;

        function dfs( data, i, depth ) {
            var results = [];
            if ( filter( data, i, depth ) ) {
                results.push( data );
            }

            data = values( data, i, depth );

            if ( !Array.isArray( data ) ) {
                return results;
            }

            return data.reduce( function ( results, d, i ) {
                return results.concat( dfs( d, i, depth + 1 ) );
            }, results )
        }
    }
})();
(function () {
    var color = window.color;
    color.palettes = {

        // 
        "paired": [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928" ],
        "default": [ "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f" ],
        
        "greens": { from: "#c7e9c0", to: "#00441b" }
    }
})();
(function() {
    var color = window.color;
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
        that.legend()
            .palette( palette )
            .data( colors )
            .draw( legend )
        legend = legend.node()
        if ( legend ) {
            var height = legend.getBBox().height;
            y.range([ y.range()[ 0 ], y.range()[ 1 ] + height + 20 ])
        }

        // start bars
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
                this.addEventListener( "mouseenter", mouseEnter )
                this.addEventListener( "mouseleave", mouseLeave )
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

    function mouseEnter ( ev ) {
        d3.select( this )
            .transition()
            .style( "opacity", .7 )
    }

    function mouseLeave ( ev ) {
        d3.select( this )
            .transition()
            .style( "opacity", 1 )
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
(function () {
    var color = window.color;
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

        function legend ( el ) { return legend.draw( bar, el ) }
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

        // extract the values for each obj
        var radius = 6;
        var data = that.data().map( function ( d ) {
            return { v: d[ that.value() ], c: d[ that.color() ], obj: d }
        })

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

        // debugger;
        groups = groups.data( data )
        groups.exit().remove();
        groups.enter().append( "g" )
            .attr( "data-legend-group", function ( d ) { 
                return d.v 
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

        // start drawing
        var legend = svg.selectAll( "g[data-pie-legend]" )
            .data( [ data ] );
        legend.enter().append( "g" )
            .attr( "data-pie-legend", "" )
        legend.attr( "transform", "translate(35,10)" )
        that.legend()
            .data( data )
            .palette( that.palette() )
            .draw( legend );

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
        slices
            .attr( "data-pie-slice", function ( d ) {
                return d.key;
            })
            .attr( "d", arc )
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
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

