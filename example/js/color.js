(function () {
    window.color = function color( element ) {
        return {
            bar: function () {
                return color.bar( element )
            },
            line: function () {
                return color.line( element );
            }
        }
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
    color.bar = function ( el ) {
        var bar = d3.select( el ).data()[ 0 ];

        if ( !( bar instanceof Bar ) ) {
            var bar = new Bar( el );
            d3.select( el ).data( [ bar ] );
        }
        
        return bar;
    }

    function Bar( el ) {
        this._el = el;
        el.innerHTML = "<svg></svg>";
    }

    Bar.prototype._x1 = "";
    Bar.prototype._color = "";
    Bar.prototype._palette = window.color.palettes.default;

    Bar.prototype.data = autodraw( getset( "_data" ) );
    Bar.prototype.x0 = autodraw( getset( "_x0" ) );
    Bar.prototype.x1 = autodraw( getset( "_x1" ) );
    Bar.prototype.x = alias( "x0" );
    Bar.prototype.y = autodraw( getset( "_y" ) );
    Bar.prototype.color = autodraw( getset( "_color" ) );
    Bar.prototype.palette = autodraw( getset( "_palette" ) );

    // draw once
    Bar.prototype.draw = function () {
        if ( !this._drawing ) {
            this._drawing = setTimeout( this._draw.bind( this ), 0 );
        }
        return this;
    }

    // actual drawing
    Bar.prototype._draw = function () {
        clearTimeout( this._drawing );
        delete this._drawing;
        draw( this );
        return this;
    }

    function draw( that ) {
        var svg = d3.select( that._el )
            .select( "svg" )
            .style( "height", "100%" )
            .style( "width", "100%" );

        var _x0 = that._x0, _x1 = that._x1, _c = that._color, _y = that._y;

        // build the groups tree
        data = d3.nest()
            .key( function ( d ) { return d[ _x0 ] || "" } )
            .key( function ( d ) { return d[ _x1 ] || "" } )
            .key( function ( d ) { return d[ _c ]  || "" } )
            .rollup( function ( data ) {
                return data.reduce( function ( v, d ) {
                    return { y: v.y + d[ _y ], y0: 0 };
                }, { y: 0 } )
            })
            .entries( that._data );

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
            .rangeRound([ 0, svg.node().offsetHeight ] );

        var allc = colors.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ that._palette.from, that._palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( that._palette )

        var c = that._palette.from && that._palette.to ? clin : cord;

        // start drawing
        var groups = svg.selectAll( "g[data-group]" )
            .data( data );
        groups.exit().remove();
        groups.enter().append( "g" )
            .attr( "data-group", function ( d ) {
                return d.key;
            })
            .attr( "transform", function ( d ) {
                return "translate(" + x0( d.key ) + ",0)";
            })

        groups
            .call( xlabels( x0, y ) )
            .transition()
            .attr( "transform", function ( d ) {
                var x = x0( d.key );
                var y = 0;
                return "translate(" + x + "," + y + ")";
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

        var rects = bars.selectAll( "rect[data-color]" )
            .data( function ( d ) { return d.values } );
        rects.exit().remove();
        rects.enter().append( "rect" )
            .attr( "data-color", function ( d ) {
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
                return y.range()[ 1 ] - y( d.values.y ) - y( d.values.y0 )
            })
            .attr( "height", function ( d ) {
                return y( d.values.y );
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
                    return "translate(" + w + "," + ( h - 3 ) + ")"
                })

            // side-effect: modify the y-range to leave space for the label
            var maxh = d3.max( labels, function ( text ) {
                return text[ 0 ].offsetHeight;
            })

            maxh += maxh ? 4 : 0;
            y.rangeRound([ 
                y.range()[ 0 ] + maxh, 
                y.range()[ 1 ] 
            ])
        }
    }

    function getset ( key ) {
        return function ( value ) {
            if ( arguments.length == 0 ) {
                return this[ key ];
            }

            this[ key ] = value;
            return this;
        }
    }

    function autodraw ( fn ) {
        return function () {
            var rv = fn.apply( this, arguments );
            return rv == this ? this.draw() : rv;
        }
    }

    function alias ( name ) {
        return function () {
            return this[ name ].apply( this, arguments );
        }
    }


})();
(function () {
    var color = window.color;
    color.line = function ( el ) {
        var line = d3.select( el ).data()[ 0 ];

        if ( !( line instanceof Line ) ) {
            var line = new Line( el );
            d3.select( el ).data( [ line ] );
        }
        
        return line;
    }

    function Line( el ) {
        this._el = el;
        el.innerHTML = "<svg></svg>";
    }

    Line.prototype._palette = window.color.palettes.default;;
    Line.prototype._stack = false;

    Line.prototype.data = autodraw( getset( "_data" ) );
    Line.prototype.x = autodraw( getset( "_x" ) );
    Line.prototype.y = autodraw( getset( "_y" ) );
    Line.prototype.stack = autodraw( getset( "_stack" ) );
    Line.prototype.color = autodraw( getset( "_color" ) );
    Line.prototype.palette = autodraw( getset( "_palette" ) );

    // draw once
    Line.prototype.draw = function () {
        if ( !this._drawing ) {
            this._drawing = setTimeout( this._draw.bind( this ), 0 );
        }
        return this;
    }

    // actual drawing
    Line.prototype._draw = function () {
        clearTimeout( this._drawing );
        delete this._drawing;
        draw( this );
        return this;
    }


    function draw( that ) {
        var svg = d3.select( that._el )
            .select( "svg" )
            .style( "height", "100%" )
            .style( "width", "100%" );

        var _x = that._x, _c = that._color, _y = that._y;

        // extract the values for each obj
        var data = that._data.map( function ( d ) {
            var x = d[ _x ];
            var y = d[ _y ];

            if ( !( x instanceof Date ) || isNaN( +x ) ) {
                throw new Error( "x-dimension must be a number or a Date" );
            }

            if ( isNaN( +y ) ) {
                throw new Error( "y-dimension must be a number" );
            }

            return { x: x, y: y, y0: 0, c: d[ _c ], obj: d }
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
                    .map( function ( d ) { return d.values });

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

        console.log( data );

        // stacke the data
        d3.layout.stack()
            .values( function ( d ) { 
                return d.values 
            })( that._stack ? data : [] );

        // build the scales
        var x = ( isTimeline ? d3.time.scale() : d3.scale.linear() )
            .domain( xExtent )
            .range( [ 0, svg.node().offsetWidth ] )

        var yExtent = d3.extent( leaves, function ( d ) { return d.y + d.y0 } );
        var y = d3.scale.linear()
            .domain( [ 0, yExtent[ 1 ] ] )
            .range( [ 4, svg.node().offsetHeight ] );

        var allc = data.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ that._palette.from, that._palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( that._palette )

        var c = that._palette.from && that._palette.to ? clin : cord;

        var area = d3.svg.area()
            .x( function ( d ) { return x( d.x ) } )
            .y0( function ( d ) {
                return y.range()[ 1 ] + y.range()[ 0 ] - y( d.y0 );
            })
            .y1( function ( d ) { 
                return y.range()[ 1 ] - y( d.y0 + d.y ) + y.range()[ 0 ];
            })

        var line = d3.svg.line()
            .x( function ( d ) { return x( d.x ) } )
            .y( function ( d ) { 
                return y.range()[ 1 ] - y( d.y0 + d.y ) + y.range()[ 0 ] 
            })

        // start drawing
        var axis = svg.selectAll( "g[data-axis='x']" )
            .data( [ data ] )

        axis.enter().append( "g" )
            .attr( "data-axis", "x" )
            .attr( "transform", "translate(0," + ( y.range()[ 1 ] - 30 ) + ")" );

        axis.call( xlabels( x, y ) )

        var groups = svg.selectAll( "g[data-group]" )
            .data( data );
        groups.exit().remove();
        groups.enter().append( "g" )
        groups.attr( "data-group", function ( d ) {
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

        var areas = groups.selectAll( "path[data-area]" )
            .data( function ( d ) { return [ d ] } );
        areas.exit().remove()
        areas.enter().append( "path" )
            .attr( "data-area", "" )
            .attr( "stroke", "none" )
        areas
            .attr( "d", function ( d ) { 
                return area( d.values ) 
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
            .style( "opacity", that._stack ? .4 : .1 );

        var points = groups.selectAll( "circle[data-point]" )
            .data( function ( d ) { 
                // only show the points that were included in the original 
                // dataset, excluding the ones that were generated to draw the 
                // chart
                return d.values.filter( function ( d ) { return !!d.obj })
            })
        points.exit().remove()
        points.enter().append( "circle" )
            .attr( "data-point", "" )
            .attr( "r", 2 )

        points
            .attr( "cx", function ( d ) { 
                return x( d.x ) 
            })
            .attr( "cy", function ( d ) {
                return y.range()[ 1 ] - y( d.y0 + d.y ) + y.range()[ 0 ]
            })
            .attr( "fill", function ( d ) {
                var key = this.parentNode.getAttribute( "data-group" );
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
            y.range([ y.range()[ 0 ], y.range()[ 1 ] - maxh ])
        }
    }

    function getset ( key ) {
        return function ( value ) {
            if ( arguments.length == 0 ) {
                return this[ key ];
            }

            this[ key ] = value;
            return this;
        }
    }

    function autodraw ( fn ) {
        return function () {
            var rv = fn.apply( this, arguments );
            return rv == this ? this.draw() : rv;
        }
    }

})();
