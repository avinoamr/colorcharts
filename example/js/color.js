(function () {
    window.color = function color( element ) {
        return {
            bar: function () {
                return color.bar( element )
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

        if ( !bar ) {
            var bar = new Bar( el );
            d3.select( el ).data( [ bar ] );
        }
        
        return bar;
    }

    function Bar( el ) {
        this._el = el;
    }

    Bar.prototype._x0 = "";
    Bar.prototype._color = "";
    Bar.prototype._palette = window.color.palettes.default;

    Bar.prototype.data = autodraw( getset( "_data" ) );
    Bar.prototype.x0 = autodraw( getset( "_x0" ) );
    Bar.prototype.x1 = autodraw( getset( "_x1", "" ) );
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
        var el = that._el;
        var svg = d3.select( el )
            .selectAll( "svg" )
            .data( [ that ] );

        svg.enter()
            .append( "svg" )
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
