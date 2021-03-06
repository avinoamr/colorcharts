(function () {
    window.color = {
        identity: identity,
        getset: getset,
        selectUp: selectUp,
        available: available,
        truncate: truncate
    }

    function selectUp ( el, selector ) {
        el = el.node ? el.node() : el;
        while ( el && el.matches && !el.matches( selector ) ) {
            el = el.parentNode;
        }
        return el;
    }

    function identity ( v ) { 
        return v;
    }

    function truncate( maxw ) {
        return function ( texts ) {
            texts.each( function () {
                var v = this.innerHTML;
                var w = this.offsetWidth;

                if ( w > maxw ) {
                    var charSize = w / v.length;
                    var nchars = maxw / charSize;

                    var newv = v.slice( 0, nchars - 3 ) + "...";
                    this.innerHTML = newv + "<title>" + v + "</title>";
                }
            })
        }
    }

    function available ( key ) {
        // determine how much available space we have in each dimension
        return function ( el ) {
            el = selectUp( el, "svg" );
            if ( !el ) {
                throw new Error( "No svg element found" )
            }
            return el.getBoundingClientRect()[ key ];
        }
    }

    function getset ( options, key ) {
        var fn = function ( value ) {
            if ( arguments.length == 0 ) {
                return options[ key ];
            }

            options[ key ] = value;
            return this;
        }

        fn.get = function () {
            var v = fn();
            if ( typeof v == "function" ) {
                v = v.apply( this, arguments );
            }
            return v;
        }
        return fn;
    }
})();
(function () {
    var color = window.color;
    var getset = color.getset;

    color.palettes = {

        // discrete
        // red, green, blue, purple, yellow, brown
        "default": [ "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f" ],
        "material": [ "#D81B60", "#43A047", "#1E88E5", "#5E35B1", "#FDD835", "#E53935", "#8E24AA", "#3949AB", "#039BE5", "#00ACC1", "#00897B", "#7CB342", "#C0CA33", "#FB8C00", "#6D4C41" ],
        "paired": [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928" ],
        "pastel": [ "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2" ],

        // warn, cool and neon
        // https://medium.com/graphiq-engineering/finding-the-right-color-palettes-for-data-visualizations-fcd4e707a283#.cbgjbosbs
        "cool": [ "#DCECC9", "#B3DDCC", "#8ACDCE", "#62BED2", "#46AACE", "#3D91BE", "#3577AE", "#2D5E9E", "#24448E", "#1C2B7F", "#162065", "#11174B" ],
        "warm": [ "#FDED86", "#FDE86E", "#F9D063", "#F5B857", "#F0A04B", "#EB8A40", "#E77235", "#E35B2C", "#C74E29", "#9D4429", "#753C2C", "#4C3430" ],
        "neon": [ "#F9CDAC", "#F3ACA2", "#EE8B97", "#E96A8D", "#DB5087", "#B8428C", "#973490", "#742796", "#5E1F88", "#4D1A70", "#3D1459", "#2D0F41" ],

        // ranges
        "greyscale": { from: "#424242", to: "#BDBDBD" },
        "reds": { from: "#fcbba1", to: "#67000d" },
        "greens": { from: "#c7e9c0", to: "#00441b" },
        "blues": { from: "#c6dbef", to: "#08306b" },
        "purples": { from: "#dadaeb", to: "#3f007d" },
        "oranges": { from: "#fdd0a2", to: "#7f2704" },
    }

    color.palette = function () {
        var options = {
            domain: null,
            colors: null
        }

        function palette() {}
        palette.colors = getset( options, "colors" );
        palette.domain = getset( options, "domain" );
        palette.scale = function () {
            var colors = options.colors;

            if ( typeof colors == "string" ) {
                colors = color.palettes[ colors ];
            }

            var domain = options.domain;

            // linear
            var isRange = !Array.isArray( colors ) && colors.from && colors.to;
            var isNumeric = domain.every( function ( d ) {
                return !isNaN( +d );
            });

            // impossible to draw as a range, turn it into a discrete set
            if ( isRange && !isNumeric ) {
                isRange = false;
                var interp = d3.interpolate( colors.from, colors.to );
                colors = domain.map( function ( d, i ) {
                    return interp( i / domain.length )
                })
            }

            if ( isRange ) {
                return d3.scale.linear()
                    .domain( d3.extent( domain ) )
                    .range( [ colors.from, colors.to ] );
            } else {
                return d3.scale.ordinal()
                    .domain( domain )
                    .range( colors );
            }
        }

        return palette
    }

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
(function () {
    var color = window.color;
    var getset = color.getset;

    color.hoverpoints = function () {
        var options = {
            x: null,
            y: null,
            color: null,
            data: null,
            duration: 50,
            radius: 8,
            distance: 40,
            tooltip: color.tooltip()
                .title( function ( data ) {
                    return data[ 0 ].point.x
                })
        }

        function hoverpoints( el ) { return hoverpoints.draw( this ) }
        hoverpoints.x = getset( options, "x" );
        hoverpoints.y = getset( options, "y" );
        hoverpoints.color = getset( options, "color" );
        hoverpoints.duration = getset( options, "duration" );
        hoverpoints.radius = getset( options, "radius" );
        hoverpoints.distance = getset( options, "distance" );
        hoverpoints.tooltip = getset( options, "tooltip" );
        hoverpoints.data = getset( options, "data" );
        hoverpoints.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( hoverpoints, hoverpoints.data() || data );
                draw( hoverpoints, this, data ); 
            })
            return this;
        }

        return hoverpoints;
    }

    function draw( that, el, data ) {
        el = d3.select( el );
        var svg = color.selectUp( el, "svg" );

        if ( el.attr( "data-color-chart" ) != "hoverpoints" ) {
            el.attr( "data-color-chart", "hoverpoints" )
                .text( "" );
        }
        el.node().__colorchart = that;

        if ( !svg.__hoverpoints ) {
            svg.addEventListener( "mousemove", mouseMove );
        }

        svg.__hoverpoints = that;
        that._el = el;
        that._xdata = data;
    }

    function mouseMove ( ev ) {
        var rect = this.getBoundingClientRect()
        var that = this.__hoverpoints;
        var x = that.x();
        var y = that.y();
        var c = that.color();
        var tooltip = that.tooltip();
        var distance = that.distance();
        var radius = that.radius();
        var duration = that.duration();

        var mx = ev.clientX - rect.left;
        var my = ev.clientY - rect.top;

        // binary search for the closest x-coordinate in the dataset
        // this is a large dataset, containing possibly thousands of 
        // x-coordinates, so it must be fast
        var data = that._xdata;
        var ci0 = 0, ci1 = data.length, ci;
        do {
            ci = ci0 + Math.floor( ( ci1 - ci0 ) / 2 )
            if ( mx > data[ ci ].x ) {
                ci0 = ci;
            } else {
                ci1 = ci;
            }
        } while ( ci1 - ci0 > 1 );

        ci = data[ ci1 ].x - mx > mx - data[ ci0 ].x ? ci0 : ci1;
        var cx = data[ ci ].x;

        // build the list of all points for the given x-coordinate
        // this is a much smaller dataset containing only a single x-coord
        // side-effect: determine if any of these points are close enough to the
        // cursor, to determine if all of the points should be highlighted or not
        var points = [], closeEnough = false;
        for ( var i = 0 ; i < data[ ci ].length ; i += 1 ) {
            var point = data[ ci ][ i ];

            // add the point to the highlight list
            points.push( point );

            // are we close enough?
            // pythagoras distance between the cursor and the point
            var dx = Math.abs( point.x - mx );
            var dy = Math.abs( point.y - my );
            var dist = Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
            closeEnough = closeEnough || dist < distance
        }

        if ( !closeEnough ) {
            points = [];
        }

        // draw the points
        var hoverpoints = that._el.selectAll( "g[data-hoverpoint]" )
            .data( points, function ( d ) {
                return [ d.x, d.y ].join( "-" )
            });
        hoverpoints.exit().remove();
        hoverpoints.enter().append( "g" )
            .attr( "data-hoverpoint", function ( d ) {
                return [ d.x, d.y ].join( "-" )
            })
            .attr( "transform", function ( d ) {
                return "translate(" + d.x + "," + d.y + ")";
            })

        // actual point circles
        var points = hoverpoints.selectAll( "circle[data-hoverpoints-point]" )
            .data( function ( d ) { return [ d ] } )
        points.exit().remove();
        points.enter().append( "circle" )
            .attr( "data-hoverpoints-point", "" )
            .attr( "r", 0 )
            .attr( "fill", function ( d ) {
                return d.c
            })
        points.transition()
            .duration( duration )
            .attr( "r", function ( d ) {
                return d.point.obj ? radius : 0
            });

        // hover-area
        var hover = hoverpoints.selectAll( "circle[data-hoverpoints-hover" )
            .data( function ( d ) { 
                return [ data[ ci ] ] 
            });
        hover.exit()
            .remove()
        hover.enter().append( "circle" )
            .attr( "data-hoverpoints-hover", "" )
            .attr( "fill", "transparent" )
            .attr( "r", distance )
            .call( tooltip );
    }

    function layout( that, data ) {
        // transpose the data to be searchable by x-coordinate
        var x = that.x(), y = that.y(), c = that.color();
        var xdata = [], map = {};
        data.forEach( function ( series ) {
            series.forEach( function ( d ) {
                var dx = x( d.x );
                if ( !map[ dx ] ) {
                    xdata.push( map[ dx ] = [] );
                    map[ dx ].x = dx;
                }
                map[ dx ].push({ 
                    x: dx, 
                    y: y( d.y ), 
                    c: c( series.key ), 
                    point: d 
                })
            })
        })

        return xdata;
    }

})();
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
            direction: HORIZONTAL,
            enabled: true
        }

        function legend ( el ) { return legend.draw( this ) }
        legend.value = getset( options, "value" );
        legend.color = getset( options, "color" );
        legend.palette = getset( options, "palette" );
        legend.data = getset( options, "data" );
        legend.direction = getset( options, "direction" );
        legend.enabled = getset( options, "enabled" );
        legend.draw = function ( selection ) {
            if ( !this.enabled() ) {
                return
            }
            
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
        el.node().__colorchart = that;

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
                .attr( "alignment-baseline", "middle" );

            x += direction == HORIZONTAL 
                ? label.node().offsetWidth + radius * 3 + 4
                : 0;

            y += direction == VERTICAL
                ? label.node().offsetHeight + radius + 4
                : 0;
        })
    }

})();
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
            baseline: null,
            data: null,
            legend: color.legend()
                .value( "key" )
                .color( "key" ),
            xaxis: color.xaxis(),
            yaxis: color.yaxis()
        }

        function line ( el ) { return line.draw( this ) }
        line.width = getset( options, "width" );
        line.height = getset( options, "height" );
        line.x = getset( options, "x" );
        line.y = getset( options, "y" );
        line.stack = getset( options, "stack" );
        line.color = getset( options, "color" );
        line.baseline = getset( options, "baseline" );
        line.palette = getset( options, "palette" );
        line.data = getset( options, "data" );
        line.legend = getset( options, "legend" );
        line.xaxis = getset( options, "xaxis" );
        line.yaxis = getset( options, "yaxis" );
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

        var isMin = that.baseline() === "minimum";
        var y = d3.scale.linear()
            .clamp( isMin )
            .domain( [ isMin ? yExtent[ 0 ] : 0, yExtent[ 1 ] ] )
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
        axis.call( that.xaxis().x( x ).y( y ) ); //xlabels( x, y ) )

        var axis = el.selectAll( "g[data-line-axis='y']" )
            .data( [ data ] )
        axis.enter().append( "g" )
            .attr( "data-line-axis", "y" )
        axis.call( that.yaxis().x( x ).y( y ) )

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
            .data( function ( d ) { 
                return that.stack() ? [] : [ d ];
            })
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
            .style( "opacity", that.stack() ? 1 : .1 );

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
                    minx = isTimeline
                        ? new Date( minx.getTime() - 1000 )
                        : minx - .1
                    data.unshift( 
                        { x: minx, y: 0, y0: 0 }, 
                        { x: xExtent[ 0 ], y: 0, y0: 0 }
                    );
                }

                // if this line begins before the chart's end, add a zero-
                // height segment to succeed it
                var maxx = d3.max( data, function ( d ) { return d.x } );
                if ( maxx != xExtent[ 1 ] ) {
                    maxx = isTimeline
                        ? new Date( maxx.getTime() + 1000 )
                        : maxx + .1
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
(function () {
    var color = window.color;
    var getset = color.getset;

    color.pie = function () {
        var options = {
            height: color.available( "height" ),
            width: color.available( "width" ),
            value: null,
            color: null,
            hole: 0,
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
        pie.hole = getset( options, "hole" );
        pie.palette = getset( options, "palette" );
        pie.data = getset( options, "data" );
        pie.legend = getset( options, "legend" );
        pie.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( pie, pie.data() || data );
                draw( pie, this, data ); 
            })
            return this;
        }

        return pie;
    }

    function draw( that, el, data ) {
        el = d3.select( el );

        if ( el.attr( "data-color-chart" ) != "pie" ) {
            el.attr( "data-color-chart", "pie" )
                .text( "" );
        }
        el.node().__colorchart = that;

        var height = that.height.get( el )
        var width = that.width.get( el )
        var radius = Math.min( height / 2, width / 2 ) - 10;

        var c = color.palette()
            .colors( that.palette() )
            .domain( data.map( function ( d ) { return d.key } ) )
            .scale();

        var arc = d3.svg.arc()
            .outerRadius( radius )
            .innerRadius( radius * that.hole() );

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
        legend.call( that.legend().palette( that.palette() ) );
        legend.attr( "transform", function () {
            var top = ( height - legend.node().getBBox().height ) / 2;
            return "translate(35," + top + ")";
        })

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

    function layout ( that, data ) {
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

        return data;
    }

})();

(function () {
    var color = window.color;
    var getset = color.getset;

    var Opentip = window.Opentip;
    if ( !Opentip ) {
        Opentip = function () {}
        Opentip.prototype.setContent = function () {}
        Opentip.styles = {};
    }
    
    Opentip.styles.colorDark = {
        "extends": "dark",
        borderWidth: false,
        background: "rgba(0,0,0,.4)",
        shadowColor: "rgba(0, 0, 0, 0.15)",
        stemLength: 3,
        borderRadius: 15,
    };

    color.tooltip = function () {
        var options = {
            value: null,
            label: null,
            title: null,
            y: null,
            v: null,
            data: null,
        }

        function tooltip ( el ) { return tooltip.draw( this ) }
        tooltip.title = getset( options, "title" );
        tooltip.content = getset( options, "content" );
        tooltip.data = getset( options, "data" );
        tooltip.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( tooltip, tooltip.data() || data );
                draw( tooltip, this, data );  
            })
            return this;
        }

        return tooltip;
    }

    function layout ( that, data ) {
        var title = that.title();
        if ( typeof title == "function" ) {
            title = title( data )
        }

        var content = that.content();
        if ( typeof content == "function" ) {
            content = content( data );
        }

        return { title: title, content: content };
    }

    function draw( that, el, data ) {
        el = d3.select( el );
        var node = el.node();
        if ( !node.__tooltip ) {
            node.__tooltip = new Opentip( node, "", {
                showOn: "mouseover",
                removeElementsOnHide: true
            })
        }
        el.node().__colorchart = that;

        var html = [
            "<h3 style='margin: 0'>" + data.title + "</h3>",
            data.content
        ].join( "<br />" )
        node.__tooltip.setContent( html )
    }

})();
(function () {
    var color = window.color;
    var getset = color.getset;

    color.xaxis = function () {
        var options = {
            enabled: true,
            x: null,
            y: null,
            data: null
        };
        
        function xaxis () { 
            return xaxis.draw( this ) 
        }

        xaxis.enabled = getset( options, "enabled" );
        xaxis.x = getset( options, "x" );
        xaxis.y = getset( options, "y" );
        xaxis.data = getset( options, "data" );
        xaxis.draw = function ( selection ) {
            if ( !this.enabled() ) {
                return
            }
            
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( xaxis, xaxis.data() || data );
                draw( xaxis, this, data );  
            })
            return this;
        }

        return xaxis;
    }

    function layout ( that, data ) {
        return data;
    }

    function draw ( that, el, data ) {
        var x = that.x();
        var y = that.y();
        var xAxis = d3.svg.axis()
            .scale( x )
            .orient( "bottom" )
            .tickSize( 10, 0 )
            .ticks( 7 );

        var maxh = 0;
        el = d3.select( el );
        el.call( xAxis )
            .each( function () {
                d3.select( this )
                    .selectAll( "path.domain" )
                    .attr( "fill", "white" );
            })
            .selectAll( "g.tick" )
                .each( function () {
                    var tick = d3.select( this );
                    var text = tick.select( "text" )
                    maxh = Math.max( maxh, text.node().offsetHeight );
                });

        maxh = maxh ? maxh + 8 : 0; 
        y.range([ 
            y.range()[ 0 ] - maxh, 
            y.range()[ 1 ] 
        ])
    }


})();(function () {
    var color = window.color;
    var getset = color.getset;

    color.yaxis = function () {
        var options = {
            inplace: false,
            enabled: true,
            x: null,
            y: null,
            data: null,
        };

        function yaxis () {
            return yaxis.draw( this );
        }

        yaxis.enabled = getset( options, "enabled" );
        yaxis.inplace = getset( options, "inplace" );
        yaxis.x = getset( options, "x" );
        yaxis.y = getset( options, "y" );
        yaxis.data = getset( options, "data" );
        yaxis.draw = function ( selection ) {
            if ( !this.enabled() ) {
                return
            }
            
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( yaxis, yaxis.data() || data );
                draw( yaxis, this, data );  
            })
            return this;
        }

        return yaxis;
    }

    function layout ( that, data ) {
        return data;
    }

    function draw ( that, el, data ) {
        return that.inplace() 
            ? drawInPlace( that, el, data )
            : drawAxis( that, el, data );
    }

    function drawInPlace ( that, el, data ) {
        var x = that.x();
        var y = that.y();

        // leave enough space for the top-most label above the bars
        y.range([
            y.range()[ 0 ],
            y.range()[ 1 ] + 20
        ])

        data = flatten( data )
            .filter( function ( d ) {
                return Boolean( d.obj )
            });

        el = d3.select( el );
        var labels = el.selectAll( 'text[data-yaxis-label]' )
            .data( data )
        labels.exit().remove();
        labels.enter().append( "text" )
            .attr( 'data-yaxis-label', '' )
            .attr( "text-anchor", "middle" )
            .attr( "alignment-baseline", "hanging" );

        labels
            .text( function ( d ) {
                return d.y;
            })
            .attr( "transform", function ( d ) {
                var xv = x( d.x || d.x0 );
                var yv = y( d.y + d.y0 ) - 20;

                if ( x.rangeBand ) {
                    xv += x.rangeBand() / 2;
                }

                return "translate(" + xv + ',' + yv + ')';
            })

    }

    function drawAxis ( that, el, data ) {
        var x = that.x();
        var y = that.y();

        var width = x.range().slice( -1 )[ 0 ] - x.range()[ 0 ];
        if ( x.rangeBand ) {
            // handle range bands where the computed width is not including
            // the extra band width at the end.
            width += x.rangeBand();
        }

        var yAxis = d3.svg.axis()
            .scale( y )
            .orient( "left" )
            .tickSize( width, 0 )
            .ticks( 3 );

        var maxw = 0;
        el = d3.select( el );
        el.call( yAxis )
            .each( function ( d ) {
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
                    maxw = Math.max( maxw, text.node().offsetWidth );
                });
        
        maxw = maxw ? maxw + 8 : 0; 
        el.attr( "transform", "translate(" + ( width + maxw ) + ",0)" );
    }

    function flatten ( data ) {
        if ( !Array.isArray( data ) ) {
            return data;
        }

        return data.reduce( function ( data, d ) {
            return data.concat( flatten( d ) );
        }, [] )
    }


})();